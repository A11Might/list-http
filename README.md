# HTTP请求列表 (List HTTP Requests)

一个简单实用的VS Code扩展，帮助你管理和导航`.http`文件中的HTTP请求。

## 功能特点

- 在侧边栏的资源管理器中显示当前`.http`文件中的所有HTTP请求
- 点击请求项可直接跳转到文件中对应的位置
- 实时监听文件变化，自动更新请求列表
- 支持所有常见HTTP方法（GET, POST, PUT, DELETE等）
- 请求列表显示方法和URL，便于快速识别

## 使用方法

1. 在VS Code中打开一个`.http`文件
2. 在资源管理器中查看"HTTP Requests"面板，所有请求将列在其中
3. 点击任意请求可立即跳转到文件中相应位置
4. 编辑文件时，请求列表会自动更新

## HTTP文件格式

此扩展支持标准HTTP文件格式，使用`###`分隔不同的请求，例如：

```
### 获取用户列表
GET https://api.example.com/users

### 创建新用户
POST https://api.example.com/users
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com"
}

### 删除用户
DELETE https://api.example.com/users/123
```

## 安装

有两种方式安装此扩展：

1. **通过VS Code扩展市场（推荐）**
   - 打开VS Code
   - 转到扩展视图 (Ctrl+Shift+X 或 Cmd+Shift+X)
   - 搜索"List HTTP Requests"
   - 点击"Install"

2. **通过VSIX文件安装**
   - 下载最新的`.vsix`文件
   - 在VS Code中，选择"视图 -> 命令面板"或按Ctrl+Shift+P (Cmd+Shift+P on Mac)
   - 输入"Install from VSIX"并选择下载的文件

## 配置选项

目前此扩展不需要任何特殊配置，安装后即可使用。

## 已知问题

- 非常长的HTTP请求可能导致显示问题

## 更新日志

### 0.0.1 (当前版本)

- 初始版本发布
- 支持基本的HTTP请求列表功能
- 实现请求导航功能

## 贡献

欢迎提交问题和建议到我们的[GitHub仓库](https://github.com/yourusername/list-http)。

## 许可证

MIT

---

**享受便捷的HTTP请求管理体验！**
