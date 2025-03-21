export const worldMapHTML = (mapList, view) => {
    // 为了使原点居中 必须为基数
    if (view % 2 == 0) {
        view += 1;
    }
    const share = Math.floor(800 / view);
    let dict = { 1: 'path', 2: 'woods', 3: 'brook', 4: 'yamakawa', 5: 'diggings', 6: 'plain', 7: 'city', 8: 'tribe', 9: 'pit' };
    const mapt = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
          * {
              margin: 0;
              padding: 0;
          }
  
          .content {
              display: grid;
              grid-template-columns: repeat(${view}, 1fr);
              grid-template-rows: repeat(${view}, 1fr);
              width: 800px;
              height: 800px;
              background:#fff;
              background-size: 100%;
          }
  
          .content .item {
              position: relative;
              box-sizing: border-box;
              border: 1px solid #000;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: rgba(127, 255, 212, 0.011);
          }
          .content .item.my::before{
              position: absolute;
              content: '';
              top: 0;
              left: 0;
              z-index: 999;
              width: 100%;
              height: 100%;
              background: url(https://smmcat.cn/run/openworld/user.png) no-repeat;
              background-size: 80%;
              background-position: center center;
          }
          .content .item.path{
              background:url(https://smmcat.cn/run/openworld/mapItem.png) no-repeat;
              background-size: 900%;
              background-position: 0px 0px;
          }
          .content .item.woods{
              background:url(https://smmcat.cn/run/openworld/mapItem.png) no-repeat;
              background-size: 900%;
              background-position: -${share}px 0px;
          }
          .content .item.brook{
              background:url(https://smmcat.cn/run/openworld/mapItem.png) no-repeat;
              background-size: 900%;
              background-position: -${share * 2}px 0px;
          }
          .content .item.yamakawa{
              background:url(https://smmcat.cn/run/openworld/mapItem.png) no-repeat;
              background-size: 900%;
              background-position: -${share * 3}px 0px;
          }
          .content .item.diggings{
              background:url(https://smmcat.cn/run/openworld/mapItem.png) no-repeat;
              background-size: 900%;
              background-position: -${share * 4}px 0px;
          }
          .content .item.plain{
              background:url(https://smmcat.cn/run/openworld/mapItem.png) no-repeat;
              background-size: 900%;
              background-position: -${share * 5}px 0px;
          }
          .content .item.city{
              background:url(https://smmcat.cn/run/openworld/mapItem.png) no-repeat;
              background-size: 900%;
              background-position: -${share * 6}px 0px;
          }
          .content .item.tribe{
              background:url(https://smmcat.cn/run/openworld/mapItem.png) no-repeat;
              background-size: 900%;
              background-position: -${share * 7}px 0px;
          }
          .content .item.pit{
              background:url(https://smmcat.cn/run/openworld/mapItem.png) no-repeat;
              background-size: 900%;
              background-position: -${share * 8}px 0px;
          }
          .content .item.other::before{
              position: absolute;
              content: '';
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: url(https://smmcat.cn/run/openworld/human.png) no-repeat;
              background-size: 80%;
              background-position: center center;
              background-color: #66ccff;
          }
      </style>
  </head>
  
  <body>
      <div class="content">
          ${mapList.map((item, index) => {
        return item.map((m, i) => {
            return `<div class="item ${dict[m] ? dict[m] : ''} ${i == Math.floor(view / 2) && index == Math.floor(view / 2) ? 'my' : ''}  ${m == '*' && !(Math.floor(view / 2) && index == Math.floor(view / 2)) ? 'other' : ''}"></div>`;
        }).join('');
    }).join('')}
      </div>
  </body>
  
  </html>
  `;
    console.log(mapList);
    return mapt;
};