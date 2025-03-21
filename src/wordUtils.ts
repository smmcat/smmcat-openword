import { worldMapHTML } from './html';
import fs from 'fs';
import path from 'path';

export interface Marker {
    lat: number;
    lng: number;
    name: string;
    info: string;
}

export interface MapSeed {
    [key: number]: number[][];
}

export interface UserLive {
    [userName: string]: [number, number];
}

export interface PlayerCoord {
    [key: string]: string[];
}

export interface RoundUserInfo {
    [userName: string]: [number, number];
}

export interface MoveFunctions {
    left: (place: [number, number], fn?: (success: boolean) => void) => [number, number];
    right: (place: [number, number], fn?: (success: boolean) => void) => [number, number];
    top: (place: [number, number], fn?: (success: boolean) => void) => [number, number];
    bottom: (place: [number, number], fn?: (success: boolean) => void) => [number, number];
}

const mapSeed: MapSeed = JSON.parse(fs.readFileSync(path.join(__dirname, './seed.json'), 'utf-8'));
const miniMapSeed: MapSeed = JSON.parse(fs.readFileSync(path.join(__dirname, './miniSeed.json'), 'utf-8'));

/**
 * 地图系统
 * */
export class WorldMap {
    map: number[][];
    mapSeed: number[][];
    dictMap: { [key: number]: string };
    dictIcon: { [key: number]: string };
    size: number;
    middion: [number, number];
    userLive: UserLive;
    playerCoord: PlayerCoord;

    constructor(size: number = 50) {
        this.map = [];
        this.size = size;
        this.middion = [Math.floor(this.size / 2), Math.floor(this.size / 2)];
        this.userLive = {};
        this.playerCoord = {};
        this.mapSeed = mapSeed[1];
        this.dictMap = { 1: '小路', 2: '森林', 3: '溪流', 4: '山川', 5: '矿区', 6: '平原', 7: '城市', 8: '部落', 9: '地牢' };
        this.dictIcon = { 1: '🐾', 2: '🌲', 3: '🌊️', 4: '⛰️', 5: '🪨', 6: '🌻', 7: '🏘️', 8: '🛖', 9: '⛩️' };
    }
    /**
       * 初始化地图
       * */
    initMap(): void {
        for (let y = 0; y < this.size; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.size; x++) {
                this.map[y][x] = 0;
            }
        }
        this.map[this.middion[1]][this.middion[0]] = 1;
    }
    /**
     * 用户移动
     * */
    userMove(userName: string, arr: [number, number]): void {
        console.log(`${userName} 移动到位置 ${arr}`);
        if (!this.map[arr[1]][arr[0]]) {
            this.map[arr[1]][arr[0]] = this.mapSeed[arr[1]][arr[0]];
        }
        this.userLive[userName] = arr;
        const key = arr.join(',');
        if (!this.playerCoord[key]) {
            this.playerCoord[key] = [];
        }
        if (this.playerCoord[key].includes(userName)) return;
        this.playerCoord[key].push(userName);
    }
    /**
     * 查看当前坐标的附近玩家
    */
    regionalPlayer(arr: [number, number]): string[] {
        return Object.keys(this.userLive).filter(item => {
            return arr[0] === this.userLive[item][0] && arr[1] === this.userLive[item][1];
        });
    }
    /**
     * 用户发起地图查看
    */
    userMapInfo(userName: string, view: number = 5): { poi: (number | string)[][]; roundUserPoi: RoundUserInfo } {
        // 溢出修正
        if (view > this.size) {
            view = this.size
        }
        if (view % 2 === 0) view += 1;

        const sliceArray = (arr: number[], startIndex: number, endIndex: number): (number | string)[] => {
            const result: (number | string)[] = [];
            for (let i = 0; i < view; i++) {
                if (!arr || startIndex + i < 0 || startIndex + i >= arr.length || i > endIndex - startIndex) {
                    result.push('x');
                } else {
                    result.push(arr[startIndex + i]);
                }
            }
            return result;
        };

        const getCoord = this.userLive[userName] || this.middion;
        let poi: (number | string)[][] = [];
        const size = this.size;
        const boundary = Array.from({ length: size }, () => '×');
        const scope = Math.floor(view / 2);

        for (let i = -scope; i < view - scope; i++) {
            if (getCoord[1] + i >= 0) {
                poi.push(this.map[getCoord[1] + i]);
            } else {
                poi.push(boundary);
            }
        }

        poi = poi.map((item, index) => {
            return sliceArray(item as number[], getCoord[0] - scope, getCoord[0] + view - scope);
        });

        let roundUserInfo: RoundUserInfo = {};
        Object.keys(this.userLive).forEach((item) => {
            if (item !== userName && Math.abs(getCoord[0] - this.userLive[item][0]) <= Math.floor(view / 2) && Math.abs(getCoord[1] - this.userLive[item][1]) <= Math.floor(view / 2)) {
                const position = this.relativeLocation(userName, item, true).coord;
                const middionPoi: [number, number] = [Math.floor(view / 2), Math.floor(view / 2)];
                roundUserInfo[item] = [middionPoi[0] + position[0], middionPoi[1] + position[1]];
            }
        });
        return { poi, roundUserPoi: roundUserInfo };
    }

    /**
     * 地图可视化 - 图形化
     */
    useHtmlmapVisualization(userName: string, view: number = 5, hiddenMe = false): { html: string; msg: string } {
        let roundInfo = this.userMapInfo(userName, view);
        const roundUser = roundInfo.roundUserPoi;
        Object.keys(roundUser).forEach((roundHuman) => {
            roundInfo.poi[roundUser[roundHuman][1]][roundUser[roundHuman][0]] = '*';
        });
        return {
            html: worldMapHTML(roundInfo.poi, view, hiddenMe),
            msg: userName ? `\n\n当前区域为：${this.dictMap[this.userMapInfo(userName, view).poi[Math.floor(view / 2)][Math.floor(view / 2)]]}` +
                `${Object.keys(roundUser).length ? `\n附近其他玩家：${Object.keys(roundUser).length > 10 ? Object.keys(roundUser).slice(0, 20).filter(item => item).join('、') + `...等${Object.keys(roundUser).length}位玩家` : Object.keys(roundUser).join('、')}` : ''}` : `地图共有${Object.keys(roundUser).length}位玩家`,
        };
    }
    /**
      * 地图可视化
      * */
    mapVisualization(userName: string, view: number = 5): string {
        let roundInfo = this.userMapInfo(userName, view);
        const roundUser = roundInfo.roundUserPoi;
        Object.keys(roundUser).forEach((roundHuman) => {
            roundInfo.poi[roundUser[roundHuman][1]][roundUser[roundHuman][0]] = '*';
        });
        return `${userName} 的地图\n` +
            roundInfo.poi.map((item, index) => item.map((i, m) => {
                if (i === 'x') return '✖';
                if (m === Math.floor(view / 2) && index === Math.floor(view / 2)) return '️👤';
                if (i === '*') return '🌝';
                if (i) return this.dictIcon[i];
                return '🌫️';
            }).join('')).join('\n') +
            `\n\n当前区域为：${this.dictMap[this.userMapInfo(userName, view).poi[Math.floor(view / 2)][Math.floor(view / 2)]]}` +
            `${Object.keys(roundUser).length ? `\n附近其他玩家：${Object.keys(roundUser).length > 10 ? Object.keys(roundUser).slice(0, 20).filter(item => item).join('、') + `...等${Object.keys(roundUser).length}位玩家` : Object.keys(roundUser).join('、')}` : ''}`;
    }
    /**
      *获取 目标玩家距离和位置
    */
    relativeLocation(userName: string, targetName: string, useMap = false): { msg: string; coord: [number, number] } {
        if (!this.userLive[targetName] && !useMap) {
            return { msg: '目标不存在', coord: [0, 0] };
        }
        const myLocation = this.userLive[userName] || this.middion;
        const targetLoaction = this.userLive[targetName];
        const coordResult: [number, number] = [targetLoaction[0] - myLocation[0], targetLoaction[1] - myLocation[1]];
        const direction = [coordResult[0] > 0 ? '右' : '左', coordResult[1] > 0 ? '下' : '上'];
        if (!Math.abs(coordResult[0]) && !Math.abs(coordResult[1])) {
            return { msg: `${targetName} 在您当前位置`, coord: [0, 0] };
        }
        return {
            msg: `${targetName} 在您的` + coordResult.map((item, index) => {
                if (!coordResult[index]) return null;
                return `${direction[index]}边距离 ${Math.abs(item)}`;
            }).filter(item => item !== null).join(','),
            coord: coordResult,
        };
    }
    /**
     显示基于玩家方位的坐标轴
     */
    markUserOriginAxis(userName: string): [number, number] {
        const position = this.userLive[userName];
        return [position[0] - this.middion[0], position[1] - this.middion[1] ? -(position[1] - this.middion[1]) : 0];
    }
    /**
     显示基于地图下标的原点方位的坐标轴
     */
    markAddressOriginAxis(arr: [number, number]): [number, number] {
        return [arr[0] - this.middion[0], arr[1] - this.middion[1] ? -(arr[1] - this.middion[1]) : 0];
    }
    /**
     显示基于原点方位的坐标轴的地图下标
     */
    markAddressIndexPositon(arr: [number, number]): [number, number] {
        return [this.middion[0] + arr[0], this.middion[0] - arr[1]];
    }

    move: MoveFunctions = {
        left: (place, fn) => {
            const result = place;
            if (result[0] - 1 > 0) {
                result[0] -= 1;
                fn && fn(true);
                return result;
            }
            fn && fn(false);
            return result;
        },
        right: (place, fn) => {
            const result = place;
            if (result[0] + 1 < this.map[result[1]].length) {
                result[0] += 1;
                fn && fn(true);
                return result;
            }
            fn && fn(false);
            return result;
        },
        top: (place, fn) => {
            const result = place;
            if (result[1] - 1 >= 0) {
                result[1] -= 1;
                fn && fn(true);
                return result;
            }
            fn && fn(false);
            return result;
        },
        bottom: (place, fn) => {
            const result = place;
            if (result[1] + 1 < this.map.length) {
                result[1] += 1;
                fn && fn(true);
                return result;
            }
            fn && fn(false);
            return result;
        },
    };
}
