# 裱一下 · BiaoYixia

**截图太裸?裱一下再发。** Windows 桌面截图美化器——把裸截图变成能直接发小红书/朋友圈/公众号的精致卡片。

Ctrl+V 粘贴截图(或拖入图片)→ 挑个背景 → 「复制 PNG」→ 去任何地方粘贴。三步,两秒。

## 功能

- **10 种背景**:星夜 / 日冕 / 银河 / 流星 / 绯霞 / 晨雾 / 奶油 / 石墨 / 纯白 / 透明(带 alpha 导出)
- **画框**:边距、圆角、阴影、缩放,全部实时预览
- **画布比例**:自适应 / 1:1 / 4:3 / 3:4(小红书) / 16:9,背景自动扩展
- **水印**:一行字,深浅背景自动换色
- **导出**:一键复制到剪贴板(直接去微信粘贴)/ 保存文件 / 2× 高清导出
- **全程本地处理**,图片不上传任何服务器

## 使用

**普通用户**:去 [Releases](../../releases) 下载 zip,解压后双击 `BiaoYixia.exe`。

**开发**:
```bash
npm install
npm start        # 若报 "Electron failed to install",按提示重装或配置 ELECTRON_MIRROR
npm run selftest # 自测:启动→截图→退出,产物 selftest.png
```

注意:在 VSCode 扩展宿主等环境里运行时需清除 `ELECTRON_RUN_AS_NODE` 环境变量。

## 技术

Electron + 原生 canvas 渲染,零前端依赖;UI 单文件 HTML。
