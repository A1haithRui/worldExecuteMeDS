// Which two films to compare, and where their per-shot clips live.
//
// Hand-edited on purpose: when newProj_v1017 starts producing its own render,
// point `right.file` at it and set `right.preroll` to 5 to match the reference.
// Every path is relative to this folder, so the page works over file://.
window.COMPARE = {
  left: {
    label: "参考片 · Claude 版",
    note: "world-execute-me-lyric-mv，87 镜，含 5 秒片头警告页",
    file: "../../world-execute-me-lyric-mv/out/study_720p30.mp4",
    preroll: 5,
    clipDir: "../../claude-version-study/shots/",
    clipPad: 3,
  },
  right: {
    label: "我们的片子 · newProj_v1014 导出",
    note: "全曲草片，无片头，画面是三段缺陷修复前的版本",
    file: "../../newProj_v1014/out/world-execute-me-deepseek-1080p60.mp4",
    preroll: 0,
    clipDir: "../shots/",
    clipPad: 3,
  },
  // The templates mirror each other 1:1, so shot N of one film is shot N of the
  // other; the id alone identifies a slot on both sides.
  timeline: {
    from: 0,
    to: 211.958,
    defaultLead: 1.2,
  },
};
