import { EventEmitter } from "eventemitter3"
import { PeerClient } from "./peer/peerClient"

interface SyncOptions {
    initialize?: boolean,
    autoPush?: boolean,
    autoPull?: boolean,
}

export class Msgbus extends EventEmitter {
    private peer: PeerClient;

    constructor(peer: PeerClient) {
        super();
        this.peer = peer;
        this.peer.once('open', () => {
            this.peer.on('data', (ev) => {
                // console.log(`--> MSG: ${ev.peerId} ->`, ev.data);
                if (ev.data?.type && ev.data?.data) {
                    this.emit(ev.data.type, ev.peerId, ev.data.data);
                }
            });
        });
    }

    public send(peerId: string, type: string, data: any) {
        // console.log(`<-- MSG: ${peerId} <-`, data);
        this.peer.send(peerId, { type, data });
    }

    public broadcast(type: string, data: any, options?: any) {
        // console.log(`<-- MSG: BROADCAST <-`, data);
        this.peer.broadcast({ type, data }, options);
    }
}

export class RpcBus extends EventEmitter {
    private _msgbus: Msgbus;
    private _serverPeerId: string;
    private _rpcId: number = 1;

    constructor(msgbus: Msgbus, options?: { serverPeerId: string }) {
        super();
        this._msgbus = msgbus;
        this._msgbus.on('rpc', (peerId: string, data: []) => {
            this._rpcRecv(peerId, data);
        });
        this._serverPeerId = options?.serverPeerId || '';
    }

    private _rpcRecv(peerId: string, data: []) {
        data.forEach((rpc: any) => {
            if (rpc.ver !== 1 || !rpc.id) return;
            if (rpc.method) {
                // for RPC request
                console.log(`--> RPC.request [${rpc.id}]: ${rpc.method}(`, rpc.params ? rpc.params : '', `);  (from:${peerId})`)
                this.emit(`rpc:${rpc.method}`, {
                    src: peerId,
                    data: {
                        method: rpc.method,
                        params: rpc.params,
                        id: rpc.id,
                    },
                });
            } else if (rpc.result || rpc.error) {
                // for RPC response
                console.log(`--> RPC.response[${rpc.id}]: ${rpc.result ? 'result' : 'error'}:`, rpc.error ? rpc.error : rpc.result, `(from:${peerId})`)
                this.emit(`rpcId:${rpc.id}`, rpc);
            }
        });
    }

    private _rpcRequest(peerId: string, method: string, params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const reqId = this._rpcId++;
            this.once(`rpcId:${reqId}`, (response: any) => {
                if (response.error) reject(response.error);
                else resolve(response.result);
            });
            console.log(`<-- RPC.request [${reqId}]: ${method}(`, params ? params : '', `);  (to:${peerId})`)
            this._msgbus.send(peerId, 'rpc', [{
                ver: 1,
                method: method,
                params: params,
                id: reqId,
            }],
            );
        });
    }

    private _rpcResponse(peerId: string, id: number, result: any) {
        this._msgbus.send(peerId, 'rpc', [{
            ver: 1,
            id: id,
            ...result,
        }],
        );
    }

    public setServerPeerId(peerId: string) {
        this._serverPeerId = peerId;
    }

    public call(method: string, options?: any): (params?: any) => Promise<any> {
        if (this._serverPeerId === '') {
            throw new Error('Server PeerId is not set')
        }
        return async (params: any) => {
            return this._rpcRequest(
                options?.PeerId ? options.PeerId : this._serverPeerId, method, params)
        }
    }

    public bind(method: string, onFunction:
        (params?: any, peerId?: string) => Promise<{ result?: any, error?: any }>) {
        this.on(`rpc:${method}`, async (event: any) => {
            const { result, error } = await onFunction(event.data.params, event.src)
            if (error) {
                console.log(`<-- RPC.response[${event.data.id}]: error:`, error, `(to:${event.src})`)
                this._rpcResponse(event.src, event.data.id, { error })
            } else {
                console.log(`<-- RPC.response[${event.data.id}]: result:`, result, `(to:${event.src})`)
                this._rpcResponse(event.src, event.data.id, { result })
            }
        })
    }
}

export class SyncBus extends EventEmitter {
    private _msgbus: Msgbus;
    private _syncPeers: string[];
    private _syncBroadcastQueue: any[];
    private _syncBroadcastSendTimer: any;
    private _syncDelay: number;
    private _syncSendQueue: Map<string, { buffer: any[], timer: any }> = new Map();

    constructor(msgbus: Msgbus) {
        super();
        this._msgbus = msgbus;
        this._syncPeers = [];
        this._syncBroadcastQueue = [];
        this._syncBroadcastSendTimer = null;
        this._syncDelay = 50;
        this._msgbus.on('sync', (peerId: string, data: any) => {
            if (this._syncPeers.includes(peerId)) {
                this._onSync(peerId, data);
            }
        });
    }

    private _onSync(peerId: string, data: any) {
        console.log(`--> SYNC.download[${peerId}]`, data)
        data.forEach(([key, value, ts]: [string, any, number]) => {
            // console.log(`--> SYNC.download[${ts ? ts : ' initialize  '}] ${key}:`, value, `(from:${peerId})`)
            this.emit(`sync:${key}`, {
                src: peerId,
                value: value,
                timestamp: ts
            });
        });
    }

    private _send(peerId: string, data: any) {
        console.log(`<-- SYNC.upload[${peerId}]`, data)
        this._msgbus.send(peerId, 'sync', data);
    }

    private _broadcast(data: any, excludeId?: string[]) {
        this._syncPeers.forEach((peerId: string) => {
            if (excludeId && excludeId.includes(peerId)) return;
            this._send(peerId, data);
        })
    }

    private _syncSend(peerId: string, key: string, data: any, ts: number) {
        // console.log(`<-- SYNC.upload  [${ts ? ts : ' initialize  '}] ${key}:`, data, `(to:${peerId})`)
        if (!this._syncSendQueue.has(peerId)) {
            this._syncSendQueue.set(peerId, { buffer: [], timer: null })
        }
        const queue = this._syncSendQueue.get(peerId)!
        queue.buffer = queue.buffer.filter((item) => item[0] !== key)
        queue.buffer.push([key, data, ts])
        if (queue.timer) {
            clearTimeout(queue.timer)
        }
        queue.timer = setTimeout(() => {
            this._send(peerId, queue.buffer);
            this._syncSendQueue.delete(peerId)
        }, this._syncDelay);
    }

    private _syncBroadcast(key: string, data: any, ts: number, excludeId?: string[]) {
        // console.log(`<-- SYNC.upload  [${ts ? ts : ' initialize  '}] ${key}:`, data, `(broadcast)`)
        if (this._syncBroadcastSendTimer) {
            clearTimeout(this._syncBroadcastSendTimer)
        }
        // [key, data, ts] 加入 list 检查 key 重复，只保留最新的
        this._syncBroadcastQueue = this._syncBroadcastQueue.filter((item) => item[0] !== key)
        this._syncBroadcastQueue.push([key, data, ts])
        this._syncBroadcastSendTimer = setTimeout(() => {
            this._broadcast(this._syncBroadcastQueue, excludeId);
            this._syncBroadcastQueue = []
            this._syncBroadcastSendTimer = null
        }, this._syncDelay);
    }

    public setDelay(delay: number) {
        this._syncDelay = delay;
    }

    public addPeerId(peerId: string) {
        if (!this._syncPeers.includes(peerId)) {
            this._syncPeers.push(peerId);
        }
    }

    public removePeerId(peerId: string) {
        this._syncPeers = this._syncPeers.filter((id) => id !== peerId);
    }

    public bind(
        key: string,
        objectRef: Ref<any>,
        options?: SyncOptions
    ): { pull: () => void, push: () => void, unsync: () => void } {

        const initialize = options?.initialize || false
        const autoPush = options?.autoPush || true
        const autoPull = options?.autoPull || true

        let externalUpdate = false
        let timestamp = initialize ? 0 : Date.now()

        watch(objectRef, () => {
            if (!externalUpdate) {
                timestamp = Date.now()
                if (autoPush) {
                    this._syncBroadcast(key, objectRef.value, timestamp)
                }
            }
            externalUpdate = false
        })

        if (autoPull) {
            this.on(`sync:${key}`, (event: any) => {
                if (event.timestamp === 0) {
                    this._syncSend(event.src, key, objectRef.value, timestamp)
                    return
                }
    
                if (event.timestamp <= timestamp) {
                    return
                }
    
                externalUpdate = true
                timestamp = event.timestamp
                objectRef.value = event.value
    
                // sync to other peers
                this._syncBroadcast(key, event.value, timestamp, [event.src])
    
                nextTick(() => {
                    externalUpdate = false
                })
            })
        }

        const pull = () => this._syncBroadcast(key, null, 0)
        const push = () => {
            timestamp = Date.now()
            this._syncBroadcast(key, objectRef.value, timestamp)
        }
        const unsync = () => this.off(`sync:${key}`)

        if (initialize) pull()

        return { pull, push, unsync }
    }

    public unbind(key: string) {
        this.off(`sync:${key}`)
    }
}