import { LogFactory } from "./InitLogger";
import axios from "axios";
import { API_BASE } from "../../config/env";

const log = LogFactory.getLogger("ApiHelper.ts");

export default class ApiHelper {

    public static async get(api: string, accessToken?: string): Promise<any> {

        log.info(`Calling API ${api}${accessToken && ` with bearer token`}`);

        const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
        const response = await axios.get(`${API_BASE}${api}`, config);
        return response.data;

    }

    public static async post(api: string, payload: any, accessToken?: string): Promise<any> {

        log.info(`Calling API ${api}${accessToken && ` with bearer token`}`);

        const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
        await axios.post(`${API_BASE}${api}`, payload, config);
        return true;

    }

    public static async patch(api: string, payload: any, accessToken?: string): Promise<any> {

        log.info(`Calling API ${api}${accessToken && ` with bearer token`}`);

        const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
        await axios.patch(`${API_BASE}${api}`, payload, config);
        return true;

    }

    public static async delete(api: string, accessToken?: string): Promise<any> {

        log.info(`Calling API ${api}${accessToken && ` with bearer token`}`);

        const config = accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {};
        await axios.delete(`${API_BASE}${api}`, config);
        return true;

    }

    // public static async executeWithAuth(promise: Promise<any>): Promise< any> {
    //     return promise.catch(err => {
    //         if (err.status === 401) {

    //         }
    //     });
    // }


}