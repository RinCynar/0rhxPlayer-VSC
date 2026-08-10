# Change Log

## [1.0.0] - 2026-08-10

首个正式版本。

### Changed
- 所有本地配置与缓存文件统一归档至 `$HOME/.0rhx/Player`（含日志、队列存档等）
- IPC 命名空间品牌化为 `rhx-player-1.0.0`
- 移除未使用的 Rust crate（wasm / wasi / macmedia）与交叉编译、CI 发布工作流
- 嵌入歌词解析结果按路径缓存，重复播放不再重复解析元数据（性能优化）

---

## [0.0.3] - 2026-08-10

### Added
- 新增 **Songs** 视图：汇总曲库全部乐曲，`标题 - 作者` 格式，按标题排序
- 新增 **Lyric** 视图：读取音乐文件**嵌入的同步歌词**并显示，支持自动滚动、双语歌词（译文换行、小字号、半透明）
- 新增 **Artwork** 视图：读取音乐文件**嵌入的专辑封面**并显示，正方形区域自适应缩放

### Changed
- 视图顺序调整为：Songs、Lyric、Artwork、Queue、Library
- LOCAL LIBRARY 视图更名为 LIBRARY
- 状态栏歌曲按钮仅显示歌曲标题（移除展开信息与详情命令）
- 状态栏新增单行歌词显示区域：仅显示原文，无歌词 / 非滚动歌词时自动隐藏
- 移除 `.lrc` 文件歌词解析逻辑，改为读取音频文件内嵌歌词

---

## [0.0.2] - 2026-08-10

### Changed
- 100% 本地化：移除全部在线功能与依赖（登录、账号、歌单广场、电台、评论、排行榜、搜索、网易云 API 等）
- 移除 Account 视图与 wasm 播放器，强制 Native 解码
- 本地 IPC 仅保留本机进程内 socket，不发起任何网络请求

### Fixed
- 修复本地库命令未注册（`newLocalLibrary` / `refreshLocalLibrary`）的问题
- 修复关闭 VSCodium 后后台进程残留、音乐继续播放的问题（父进程存活检测）
- 修复首次播放需点击两次的问题（初始化信号完整化）

---

## [0.0.1] - 2026-08-10

### Added
- 初始版本：基于 cloudmusic-vscode 的实现逻辑与外观设计
- 品牌重命名：扩展 ID `rincynar.0rhxplayer`、显示名 0rhxPlayer
- Native 解码（Rust rodio + symphonia）：FLAC / MP3 / WAV
- 本地播放队列、状态栏播放控制、系统媒体控制（Media Session）
