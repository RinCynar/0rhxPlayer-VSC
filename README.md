# 0rhxPlayer

**0rhxPlayer**（扩展 ID：`rincynar.0rhxplayer`）是一个 **100% 本地** 的 VSCode 音乐播放器，**不发起任何网络请求**：无登录、无账号、无歌单广场、无电台、无评论、无排行榜、无在线搜索。

> 仓库：https://github.com/RinCynar/0rhxPlayer ｜ 当前版本：**1.0.1**

![0rhxPlayer](https://github.com/RinCynar/0rhxPlayer/blob/main/pic.png?raw=true)

## 视图

| 视图 | 说明 |
|---|---|
| **Songs** | 汇总曲库中全部乐曲，`标题 - 作者` 格式，按标题排序 |
| **Lyric** | 显示音乐文件**嵌入的同步歌词**，自动滚动；支持双语歌词（译文换行、小字号、半透明） |
| **Artwork** | 显示音乐文件**嵌入的专辑封面**，正方形区域自适应缩放 |
| **Queue** | 播放队列（顺序 / 随机 / 单曲循环） |
| **Library** | 本地文件夹曲库，自动扫描 FLAC / MP3 / WAV |

## 功能

- **本地音乐库**：导入本地文件夹，自动解析 **FLAC / MP3 / WAV** 元数据（标题、歌手、专辑、时长、封面）
- **播放队列**：添加 / 删除 / 排序 / 随机 / 清空队列
- **播放控制**：播放 / 暂停 / 上一首 / 下一首、进度拖动（seek）、倍速播放、音量调节
- **嵌入歌词**：读取音频文件内嵌的同步歌词（ID3 USLT / FLAC "LYRICS" / Vorbis，LRC 格式），在 Lyric 视图自动滚动、双语显示；状态栏显示单行原文（无歌词则不显示）
- **嵌入封面**：Artwork 视图显示内嵌专辑封面
- **系统媒体控制**：通过系统媒体控件（Media Session）控制播放
- **Native 解码**：Rust（rodio + symphonia）直接读取本地文件解码，零网络依赖

## 支持格式

| 容器 | 说明 |
|---|---|
| FLAC | ✅ |
| MP3 (MPEG) | ✅（排除 AAC 编码） |
| WAVE | ✅ |
| 嵌入歌词 | ✅（同步歌词 / 双语） |
| 嵌入封面 | ✅ |

## 本地数据

所有本地生成的配置与缓存文件严格归档于 **`$HOME/.0rhx/Player`**：

```
~/.0rhx/Player/
├── retain          # 播放队列存档
├── err-1.0.0.log   # 运行日志
└── cache/music     # 音乐缓存目录（默认本地库项）
```

- 可通过配置 `0rhxplayer.cache.path` 自定义该目录
- 卸载扩展后手动删除该目录即可完全清除本地数据

## 隐私与安全

- **零网络请求**：不访问任何 HTTP / WebSocket 服务，不采集任何遥测数据
- 唯一的外部通信是扩展与本地 IPC 服务器之间的 **本机进程内 socket**（用于播放控制，不经过网络）
- 配置与缓存仅保存在本地 `~/.0rhx/Player`，不含任何个人信息

## 安装

1. 下载 `release-1.0.1.vsix`
2. 在 VSCode / VSCodium 中执行 `Extensions: Install from VSIX...` 选择该文件
3. 或命令行安装：`code --install-extension release-1.0.1.vsix`

## 构建（开发环境）

```bash
# 1. 安装依赖
node .yarn/releases/yarn-4.2.2.cjs install

# 2. 编译 Rust native 模块（Windows x64）
cd crates/native
cargo build --release --target x86_64-pc-windows-msvc
cp index.node ../../build/win32-x64.node

# 3. 构建 bundle
cd ../..
deno run --allow-all scripts/build.mts --prod

# 4. 打包
vsce package --no-dependencies
```

## 架构

```
┌──────────────┐   IPC (本地 named pipe / socket)   ┌──────────────────┐
│  VS Code 扩展 │ ─────────────────────────────────▶ │  共享 server 进程 │
│ (client)      │                                    │ (NativePlayer)   │
│  - 5 个视图    │                                    │  - rodio/symphonia│
│  - 状态栏控制  │ ◀───────────────────────────────── │  - 嵌入歌词/封面   │
└──────────────┘                                     └──────────────────┘
```

- **Client**：视图（Songs / Lyric / Artwork / Queue / Library）、状态栏播放控制、IPC 客户端
- **Server**：独立 Node 进程，持有 Rust Native 播放器（rodio + symphonia 解码 FLAC / MP3 / WAV），解析嵌入歌词与封面
- **IPC**：本地进程间通信（named pipe / unix socket），仅在本机，不经过网络

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)。

## 鸣谢

0rhxPlayer 的实现逻辑与外观设计继承自 [cloudmusic-vscode](https://github.com/YXL76/cloudmusic-vscode)，在此对原作者 YXL 及其贡献表示由衷感谢。

同时感谢以下开源项目与社区：

| 项目 | 用途 |
|---|---|
| [cloudmusic-vscode](https://github.com/YXL76/cloudmusic-vscode) | 实现逻辑与外观设计的基础（MIT） |
| [rodio](https://github.com/RustAudio/rodio) | Rust 音频播放库 |
| [symphonia](https://github.com/pdeljanov/Symphonia) | 音频解码器（FLAC / MP3 / WAV） |
| [cpal](https://github.com/RustAudio/cpal) | 跨平台音频输出 |
| [neon](https://github.com/neon-bindings/neon) | Rust ↔ Node.js 原生绑定 |
| [music-metadata](https://github.com/Borewit/music-metadata) | 音频元数据解析（标签 / 嵌入歌词 / 封面） |
| [souvlaki](https://github.com/Leastrio/souvlaki) | 系统媒体控制（Media Session） |
| [VS Code](https://github.com/microsoft/vscode) | VS Code 扩展 API 与生态 |

## License

[MIT](LICENSE)

