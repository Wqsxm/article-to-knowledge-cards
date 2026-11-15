# local-imagegen

给 **dsh-go 手机 App** 用的本地生图插件：在输入框上方加一颗「生图」胶囊，把你写在输入框里的文字当提示词，调用免费出图接口生成图片，直接存进手机相册。零 API Key、零登录。

> 这是 dsh-go 的原生界面插件（dshGo 元数据 + composer.actions），不是 Cordis 插件，也不是 Harness Web UI 插件。装进 dsh-go/plugins/ 后，在 App 的「引擎」页重启一次引擎即生效。

## 1. 项目解决什么问题

在手机上跟 AI 聊着聊着，想把一句话直接变成一张图——通常要切 App、复制提示词、去别的出图站重打一遍，麻烦且断思路。

本插件把「写提示词 → 出图 → 存相册」整个流程收进 App 里：输入框里写什么，点一下胶囊就是什么，图直接落到手机相册，看都不用切窗口。

## 2. 主要功能

- 输入框上方多一颗「生图」胶囊（composer 动作，图标 generate-image）
- 点一下，读取当前草稿文字作为提示词
- 通过 Pollinations 公开接口生成 768×1024 JPEG
- 图片按顺序存到：
  1. /sdcard/Pictures/DSH-Go
  2. /sdcard/Download/DSH-Go
  3. ~/Pictures/DSH-Go（非 Android 环境兜底）
- 文件名形如 gen-20261115-184512.jpg（年月日-时分秒）
- 中英文界面自动切换提示，失败给出具体原因不装死
- 不需要 API Key，不登录，本地只发一条 GET 请求

## 3. 安装方法

前置条件：装有 dsh-go 桥接的引擎（手机本机引擎即可），Node >= 18。

方法一（克隆 + 注册）：

    git clone https://github.com/<你的用户名>/local-imagegen.git
    dsh plugin --profile web add ./local-imagegen

方法二（压缩包）：把 zip 解压放进 dsh-go/plugins/，再执行 dsh plugin --profile web add ./local-imagegen。

装完在 App「引擎」页重启一次引擎，输入框上方即出现「生图」胶囊。

卸载：

    dsh plugin --profile web remove local-imagegen

## 4. 使用方法

1. 在输入框写下画面描述（提示词限 400 字符内）
2. 点一下「生图」胶囊
3. 胶囊进入「正在画…」状态（最多等待 55 秒）
4. 成功提示「画好了，去相册 DSH-Go 看」，到相册 DSH-Go 文件夹查看图片

输入框为空时点胶囊，会提示「先在输入框写要画什么」。

## 5. 输入输出示例

正常示例

- 输入（输入框草稿）：蓝色头发的鲸鱼少女，海边的黄昏
- 实际请求：GET https://image.pollinations.ai/prompt/<编码后的提示词>?width=768&height=1024&nologo=true&seed=483920
- 输出（文件）：/sdcard/Pictures/DSH-Go/gen-20261115-184512.jpg
- 输出（App 提示）：画好了，去相册 DSH-Go 看

失败示例对照表

| 情形 | App 提示 |
| --- | --- |
| 输入框为空 | 先在输入框写要画什么 |
| 网络未通 | 网络没通，等会儿再试 |
| 接口返回非 2xx | 出图失败 <状态码> |
| 下载中断 | 图没收全，再试一次 |
| 返回体太小 | 这次没画出来，再试 |
| 三个保存目录都写不进 | 图存不进去，检查存储 |

## 依赖的接口

出图走 Pollinations 公开接口：

    GET https://image.pollinations.ai/prompt/<URL 编码后的提示词>?width=768&height=1024&nologo=true&seed=<随机数>

- 免费接口，所以慢、会失败、画风不稳定，都是正常的
- 内容尺度由对方服务把关，本插件不做额外过滤也不做绕过
- 想换出图服务，改 lib/index.js 里的 API 常量和取图段即可

## 文件结构

    package.json      # 插件清单：dshGo 段声明胶囊，dsh.bundle 指向 cordis.patch.yml
    cordis.patch.yml  # 把本插件注册进 profile 的补丁
    lib/index.js      # 点按处理：读 draft → 请求接口 → 写文件 → 返回 toast
    README.md
    LICENSE

## 已知限制

- 只有装了 dsh-go 桥接的主机（手机本机引擎）才有胶囊，其他主机不显示
- 引擎要求 Node >= 18
- 出图是异步的：App 端最多等 55 秒，超时按失败处理
- 一次只生成一张，不排队、不重试

## 许可

MIT
