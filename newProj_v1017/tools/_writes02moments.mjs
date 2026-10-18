// One-off: write section 2's narrative moments into shots/table.js.
import { readFileSync, writeFileSync } from "node:fs";

const MOMENTS = {
  title: "火花亮起——聊天世界里的第一抹光；下方输入条打出启动命令 world.execute(me);，回车，画面一闪，会话开始。",
  "chat-open": "整张客户端打开一张空白会话；鼠标指针从右上划过窗口——用户来了；左下角的状态第一次亮成 online。",
  "chat-type": "推近到输入条：先打出一句 how does a sine wave work，全选删掉，再打出真正的问题——would you love me if I ran you。",
  "chat-think": "问题送出，作为气泡落在右侧并标注 Delivered；发送键变成停止键，标志缩小左移，镜头开始坠入标志——答案将在里面成形。",
};

let src = readFileSync("shots/table.js", "utf8");
let done = 0;
for (const [id, moment] of Object.entries(MOMENTS)) {
  const re = new RegExp(
    `("id": "${id}",[\\s\\S]*?"moment": )"[^"]*"(,\\s*"momentState": )"[^"]*"`,
  );
  if (!re.test(src)) {
    console.log(`未匹配: ${id}`);
    continue;
  }
  src = src.replace(re, (m, a, b) => `${a}${JSON.stringify(moment)}${b}"written"`);
  done += 1;
}
writeFileSync("shots/table.js", src);
console.log(`写入 ${done} 镜叙事时刻`);
