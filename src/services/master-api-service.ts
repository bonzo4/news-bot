import { URL } from 'node:url';

import { HttpService } from './index.js';
import { config } from '../config/config.js';
import {
    LoginClusterResponse,
    RegisterClusterRequest,
    RegisterClusterResponse,
} from '../models/master-api/index.js';

export class MasterApiService {
    private clusterId: string;

    constructor(private httpService: HttpService) {}

    public async register(): Promise<void> {
        let reqBody: RegisterClusterRequest = {
            shardCount: config.clustering.shardCount,
            callback: {
                url: config.clustering.callbackUrl,
                token: config.api.secret,
            },
        };

        let res = await this.httpService.post(
            new URL('/clusters', config.clustering.masterApi.url),
            config.clustering.masterApi.token,
            reqBody
        );

        if (!res.ok) {
            throw res;
        }

        let resBody = (await res.json()) as RegisterClusterResponse;
        this.clusterId = resBody.id;
    }

    public async login(): Promise<LoginClusterResponse> {
        let res = await this.httpService.put(
            new URL(`/clusters/${this.clusterId}/login`, config.clustering.masterApi.url),
            config.clustering.masterApi.token
        );

        if (!res.ok) {
            throw res;
        }

        return (await res.json()) as LoginClusterResponse;
    }

    public async ready(): Promise<void> {
        let res = await this.httpService.put(
            new URL(`/clusters/${this.clusterId}/ready`, config.clustering.masterApi.url),
            config.clustering.masterApi.token
        );

        if (!res.ok) {
            throw res;
        }
    }
}
