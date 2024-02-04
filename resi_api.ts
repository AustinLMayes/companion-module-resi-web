// Class for interacting with the Resi API
// Uses HTTP requests to interact with the Resi API

import got from 'got';

export class ResiApi {
    // base URL for the Resi API
    private readonly baseUrl = 'https://central.resi.io/api/v3';
    private readonly baseUrlV2 = 'https://central.resi.io/api_v2.svc';
    private readonly username: string;
    private readonly password: string;
    private token: string | null = null;
    private tokenExpiration: number = 0;
    private customerId: string | null = null;
    private userId: string | null = null;

    private encoderStatus: any = {};

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
        this.token = null; // Initialize token as null
    }

    async getToken(): Promise<void> {
        console.log('Getting token');
        const response = await got.post(`${this.baseUrl}/auth/token`, {
            json: {
                username: this.username,
                password: this.password,
                grant_type: 'password_cookie'
            }
        });

        const body = JSON.parse(response.body);

        this.token = body.access_token;
        this.tokenExpiration = Date.now() + body.expires_in * 1000;
    }

    needsToken(): boolean {
        return this.token === null || this.tokenExpiration < Date.now();
    }
    
    async getMe(): Promise<any> {
        if (this.needsToken()) {
            console.log('Don\'t have token, getting token');
            await this.getToken();
        }

        console.log('Getting user data');
        const response = await got.get(`${this.baseUrlV2}/users/me`, {
            headers: {
                Authorization: `X-Bearer ${this.token}`
            }
        });

        const body = JSON.parse(response.body);

        this.customerId = body.customerId;
        this.userId = body.userId;
    }

    needsUserData(): boolean {
        return this.customerId === null || this.userId === null;
    }
    
    async getEncoderStatus(): Promise<any> {
        if (!this.needsStatusRefresh()) {
            console.log('No need to refresh status');
            return;
        }

        if (this.needsToken()) {
            console.log('Don\'t have token, getting token');
            await this.getToken();
        }

        if (this.needsUserData()) {
            console.log('Don\'t have user data, getting user data');
            await this.getMe();
        }

        console.log('Getting encoder status');
        const response = await got.get(`${this.baseUrl}/customers/${this.customerId}/monitors`, {
            headers: {
                Authorization: `X-Bearer ${this.token}`
            }
        });

        const body = JSON.parse(response.body);

        this.encoderStatus = {};
        for (const encoder of body.encoderStatus) {
            this.encoderStatus[encoder.encoderId] = encoder;
        }

        return this.encoderStatus;
    }

    needsStatusRefresh(): boolean {
        if (Object.keys(this.encoderStatus).length === 0) {
            return true;
        }

        const now = Date.now();
        for (const encoderId in this.encoderStatus) {
            // parse datetime like "2024-02-04T06:14:12Z"
            if (this.encoderStatus[encoderId].lastUpdate) {
                let lastUpdate = Date.parse(this.encoderStatus[encoderId].lastUpdate);
                if (lastUpdate + 20000 < now) {
                    return true;
                }
            } else {
                return true;
            }
        }

        return false;
    }

    async getEncoderStatusById(encoderId: string): Promise<any> {
        if (this.needsStatusRefresh()) {
            await this.getEncoderStatus();
        }

        return this.encoderStatus[encoderId];
    }

    async getEncoders(): Promise<any> {
        if (this.needsToken()) {
            console.log('Don\'t have token, getting token');
            await this.getToken();
        }

        if (this.needsUserData()) {
            console.log('Don\'t have user data, getting user data');
            await this.getMe();
        }

        console.log('Getting encoders');

        const response = await got.get(`${this.baseUrlV2}/encoders?wide=true`, {
            headers: {
                Authorization: `X-Bearer ${this.token}`
            }
        });

        const body = JSON.parse(response.body);

        let encoders: any = {};
        for (const encoder of body) {
            encoders[encoder.uuid] = encoder.name;
        }

        return encoders;
    }

    async getEncoderProfiles(): Promise<any> {
        if (this.needsToken()) {
            console.log('Don\'t have token, getting token');
            await this.getToken();
        }

        if (this.needsUserData()) {
            console.log('Don\'t have user data, getting user data');
            await this.getMe();
        }

        console.log('Getting encoder profiles');
        const response = await got.get(`${this.baseUrl}/customers/${this.customerId}/encoderprofiles`, {
            headers: {
                Authorization: `X-Bearer ${this.token}`
            }
        });

        const body = JSON.parse(response.body);

        let profiles: any = {};

        for (const profile of body) {
            profiles[profile.uuid] = profile.name;
        }

        return profiles;
    }

    async getEventProfiles(): Promise<any> {
        if (this.needsToken()) {
            console.log('Don\'t have token, getting token');
            await this.getToken();
        }

        if (this.needsUserData()) {
            console.log('Don\'t have user data, getting user data');
            await this.getMe();
        }

        console.log('Getting event profiles');

        const response = await got.get(`${this.baseUrl}/customers/${this.customerId}/eventprofiles`, {
            headers: {
                Authorization: `X-Bearer ${this.token}`
            }
        });

        const body = JSON.parse(response.body);

        let profiles: any = {};

        for (const profile of body) {
            profiles[profile.uuid] = profile.name;
        }

        return profiles;
    }

    async startEncoder(encoderId: string, streamProfile: string, encoderProfile: string): Promise<any> {
        if (this.needsToken()) {
            await this.getToken();
        }

        if (this.needsUserData()) {
            await this.getMe();
        }

        try {
            const response = await got.patch(`${this.baseUrlV2}/encoders/${encoderId}`, {
                headers: {
                    Authorization: `X-Bearer ${this.token}`
                },
                json: {
                    streamProfile: {
                        uuid: streamProfile
                    },
                    encoderProfile: {
                        uuid: encoderProfile
                    },
                    requestedStatus: 'start'
                }
            });
    
            return response.statusCode;
        } catch (error) {
            console.error('Error starting encoder: ' + error);
            return 500;
        }
    }

    async stopEncoder(encoderId: string): Promise<any> {
        if (this.needsToken()) {
            await this.getToken();
        }

        if (this.needsUserData()) {
            await this.getMe();
        }

        console.log('Stopping encoder ' + encoderId);

        try {
            const response = await got.patch(`${this.baseUrlV2}/encoders/${encoderId}`, {
                headers: {
                    Authorization: `X-Bearer ${this.token}`
                },
                json: {
                    requestedStatus: 'stop'
                }
            });
    
            console.log('Response: ' + response.statusCode + ' ' + response.body);
    
            return response.statusCode;
        } catch (error) {
            console.error('Error stopping encoder: ' + error);
            return 500;
        }
    }
}