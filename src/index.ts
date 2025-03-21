import { Context, Schema, h } from 'koishi'
import path from 'path'
import { WorldMap } from './wordUtils';
import { getOrCreateFile, setOrCreateFile } from './fileUtils';
import { } from 'koishi-plugin-smmcat-localstorage'
import { } from 'koishi-plugin-puppeteer'

export interface Config {
  historyData: string;
  wordSize: number;
  userInfo: string;
  playerArea: string;
  imaging: boolean
}

export const name = 'smmcat-openword'
export const inject = ['localstorage', 'puppeteer']

export const Config: Schema<Config> = Schema.object({
  historyData: Schema.string().default("./data/openwordData/world.json").description("主世界地图位置"),
  playerArea: Schema.string().default("./data/openwordData/userArea.json").description("玩家地图位置区域"),
  userInfo: Schema.string().default("./data/openwordData/userInfo.json").description("玩家信息"),
  wordSize: Schema.number().default(50).description("世界大小 [长度格子]"),
  imaging: Schema.boolean().default(false).description("图形化输出")
})

export function apply(ctx: Context, config: Config) {
  
  async function getStoreWordMap() {
    const result = await getOrCreateFile(path.join(ctx.baseDir, config.historyData), true);
    return JSON.parse(result);
  }
  async function setStoreWordMap(map) {
    const mapStrData = JSON.stringify(map);
    await setOrCreateFile(path.join(ctx.baseDir, config.historyData), mapStrData);
    return true;
  }
  async function getStoreUserArea() {
    const result = await getOrCreateFile(path.join(ctx.baseDir, config.playerArea));
    return JSON.parse(result);
  }
  async function setStoreUserArea(userLive) {
    const userLiveStrData = JSON.stringify(userLive);
    await setOrCreateFile(path.join(ctx.baseDir, config.playerArea), userLiveStrData);
    return true;
  }

  async function getStoreUserInfo() {
    const result = await getOrCreateFile(path.join(ctx.baseDir, config.userInfo));
    return JSON.parse(result);
  }

  async function setStoreUserInfo(userInfo2) {
    const userLiveStrData = JSON.stringify(userInfo2);
    await setOrCreateFile(path.join(ctx.baseDir, config.userInfo), userLiveStrData);
    return true;
  }

  const word = new WorldMap(config.wordSize);
  const StoreFn = {
    getStoreWordMap,
    setStoreWordMap,
    getStoreUserArea,
    setStoreUserArea,
    getStoreUserInfo,
    setStoreUserInfo
  };
  async function getWordMap() {
    word.map = await StoreFn.getStoreWordMap();
    if (!word.map.length) {
      word.initMap();
      await StoreFn.setStoreWordMap(word.map);
    }
  }

  async function getWordUser() {
    word.userLive = await StoreFn.getStoreUserArea();
    userInfo = await StoreFn.getStoreUserInfo();
  }

  getWordMap();
  getWordUser();
  let userInfo = {};
  let directionDict = ["上", "下", "左", "右"];
  async function setStoreFn() {
    await Promise.all([
      StoreFn.setStoreWordMap(word.map),
      StoreFn.setStoreUserInfo(userInfo),
      StoreFn.setStoreUserArea(word.userLive)
    ]);
    console.log("完成本地存储");
  }

  ctx.setInterval(async () => {
    await setStoreFn();
  }, 6e4);
  function isExistUserName(userName) {
    return Object.keys(userInfo).some((item) => {
      return userInfo[item].name === userName.trim();
    });
  }

  ctx.command("异世界.注册 <uname>").action(async ({ session }, uname) => {
    if (userInfo[session.userId]) {
      await session.send(`你已经持有角色，角色名为 ${userInfo[session.userId].name}`);
      return;
    }
    if (!uname || uname.trim() === "") {
      await session.send("角色名不能为空");
      return;
    }
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{3,16}$/.test(uname.trim())) {
      await session.send("角色名不合法");
      return;
    }
    if (isExistUserName(uname)) {
      await session.send("角色名已创建。请更换其他名字");
      return;
    }
    userInfo[session.userId] = {
      poi: word.middion.slice(),
      name: uname,
      status: {
        hp: 100,
        pp: 100,
        maxHp: 100
      },
      config: {
        atk: 19,
        def: 3,
        crl: 0.1,
        hit: 2,
        speed: 5,
        evasion: 0.3,
        chd: 1.5
      }
    };
    await session.send(`角色名 ${uname} 创建成功`);
  });
  ctx.command("异世界.传送 <x:number> <y:number>").action(async ({ session }, x, y) => {
    console.log(x, y);
    if (isNaN(x) || isNaN(y)) {
      await session.send("请输入正确的坐标轴，例如 异世界 传送 5 5\n代表传送到 (5,5) 区域的坐标");
      return;
    }
    if (Math.abs(x) > Math.floor(word.size / 2) || Math.abs(y) > Math.floor(word.size / 2)) {
      await session.send("坐标过大，目前最大地图区域为 " + Math.floor(word.size / 2));
      return;
    }
    const temp = getUserQueryTemp(session.userId);
    const goal = word.markAddressIndexPositon([x, y]);
    word.userMove(userInfo[session.userId].name, goal);
    userInfo[session.userId].poi = goal;
    temp.startUse();
    if (!config.imaging) {
      await session.send("[√] 传送成功");
      await session.send(word.mapVisualization(userInfo[session.userId].name, 9));
      temp.clearUse();
    } else {
      try {
        const msg = word.useHtmlmapVisualization(userInfo[session.userId].name, 9);
        const imgUrl = await ctx.puppeteer.render(msg.html);
        await session.send(imgUrl + msg.msg);
        temp.clearUse();
      } catch (error) {
        console.log(error);
        temp.clearUse();
      }
    }
  });
  ctx.command("异世界.移动 <direction>").action(async ({ session }, direction) => {
    if (!userInfo[session.userId]) {
      await session.send(`你还没创建角色。请先 /异世界 注册 xxx`);
      return;
    }
    const temp = getUserQueryTemp(session.userId);
    if (temp.isUse) {
      await session.send("请等待上一个操作的结束");
      return;
    }
    if (!directionDict.includes(direction)) {
      await session.send("方向不对。\n 目前只允许 上下左右");
      return;
    }
    const moveTo = {
      "上": word.move.top,
      "下": word.move.bottom,
      "左": word.move.left,
      "右": word.move.right
    };
    const loca = userInfo[session.userId].poi;
    console.log(word.mapVisualization());
    let type = false;
    word.userMove(userInfo[session.userId].name, moveTo[direction](loca, (t) => {
      type = t;
    }));
    temp.startUse();
    if (!config.imaging) {
      const errmsg = type ? "[√] 移动成功！" : "[×] 此路不通！";
      await session.send(word.mapVisualization(userInfo[session.userId].name, 9) + "\n" + errmsg);
      temp.clearUse();
    } else {
      try {
        const msg = word.useHtmlmapVisualization(userInfo[session.userId].name, 9);
        const imgUrl = await ctx.puppeteer.render(msg.html);
        await session.send(imgUrl + msg.msg);
        temp.clearUse();
      } catch (error) {
        console.log(error);
        temp.clearUse();
      }
    }
  });
  ctx.command("异世界.玩家 <username>").action(async ({ session }, username) => {
    if (!word.userLive[username]) {
      await session.send("没有该玩家。");
      return;
    }
    const msg = word.relativeLocation(userInfo[session.userId].name, username).msg;
    await session.send(msg);
  });
  ctx.command("异世界.区域").action(async ({ session }) => {
    if (!userInfo[session.userId]) {
      await session.send(`你还没创建角色。请先 /异世界 注册 xxx`);
      return;
    }
    const userLocation = userInfo[session.userId].poi;
    const addressAxios = word.markAddressOriginAxis(userLocation);
    console.log(word.userLive);
    console.log(userInfo);
    const msg = word.regionalPlayer(userLocation);
    await session.send(`当前区域 (${addressAxios[0]},${addressAxios[1]}) 存在的玩家为：` + msg);
  });
  const userWebTemp = {};
  function getUserQueryTemp(userId) {
    if (!userWebTemp[userId]) {
      userWebTemp[userId] = {
        isUse: false,
        lastQueryData: {},
        startUse() {
          this.isUse = true;
        },
        clearUse() {
          this.isUse = false;
        }
      };
    }
    return userWebTemp[userId];
  }
}
