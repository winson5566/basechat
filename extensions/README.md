# BaseChat Widget Chrome Extension

这是一个Chrome浏览器扩展，可以将BaseChat聊天机器人嵌入到任何网页中。

> 📖 完整文档请查看：[EXTEND_WIDGET_COMPLETE_GUIDE.md](../EXTEND_WIDGET_COMPLETE_GUIDE.md)

## 功能特性

- 在任何网页上显示聊天机器人气泡
- 无需登录即可使用
- 支持流式对话
- 现代化的UI设计
- 可以最小化/关闭
- 动态调整iframe大小，不阻挡页面内容

## 安装方法

### 开发模式安装

1. 打开Chrome浏览器，进入 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `extensions` 文件夹

### 配置使用

1. 点击浏览器工具栏中的扩展图标
2. 输入chatbot URL，格式如：`http://localhost:3000/chatbot/YOUR_CHATBOT_ID`
3. 点击"Save"保存设置（默认在所有页面启用）
4. 访问任何网页，右下角会出现聊天气泡

## 获取Chatbot URL

1. 登录BaseChat系统
2. 访问Widget信息页面：`http://localhost:3000/o/YOUR_ORG/extend_widget_info`
3. 复制显示的Chatbot URL

或者从数据库查询：

```sql
SELECT id FROM tenants WHERE slug = 'your-org-slug';
-- URL格式：http://localhost:3000/chatbot/{tenant-id}
```

## 目录结构

```
extensions/
├── manifest.json        # 扩展配置文件
├── popup.html          # 设置弹窗页面
├── popup.js            # 设置页面逻辑
├── content.js          # 注入到网页的脚本
├── content.css         # 注入到网页的样式
├── icons/              # 扩展图标（需要添加）
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # 本文件
```

## 图标文件（可选）

图标已从manifest中移除，扩展会使用Chrome默认图标。

如果需要自定义图标，可以：

1. 在 `extensions/icons/` 目录下添加 `icon16.png`, `icon48.png`, `icon128.png`
2. 在 `manifest.json` 中恢复图标配置

建议使用聊天气泡或机器人图标，背景透明的PNG格式。

## 技术说明

- 使用Chrome Extension Manifest V3
- 通过iframe嵌入chatbot页面
- 使用Chrome Storage API保存配置
- 支持所有网站（需要适当的权限）
- 通过postMessage动态调整iframe大小
- 气泡100x100，展开450x700，不阻挡页面内容

## 安全注意事项

- 扩展需要访问所有网站的权限才能注入widget
- 请只从可信来源加载chatbot
- 生产环境请使用HTTPS

## 调试

1. 在 `chrome://extensions/` 中找到扩展
2. 点击"详细信息"
3. 点击"背景页"或"检查视图"进行调试
4. 在网页上按F12，可以调试注入的content script

## 许可证

与BaseChat主项目相同
