# HTTP请求列表 (List HTTP Requests)

一个简单实用的VS Code扩展，帮助你管理和导航`.http`文件中的HTTP请求。

## 功能特点

- 在侧边栏的资源管理器中显示当前`.http`文件中的所有HTTP请求
- 支持通过`###`后紧跟`# 注释`的方式为请求分组
- 点击请求项可直接跳转到文件中对应的位置

## 使用方法

1. 在VS Code中打开一个`.http`文件
2. 在资源管理器中查看"HTTP Requests"面板，所有请求将列在其中
3. 点击任意请求可立即跳转到文件中相应位置
4. 编辑文件时，请求列表会自动更新

### 请求分组

如果一个由`###`分隔的块，其第一行有效内容是以`#`开头的注释，并且该块内没有HTTP方法（如GET, POST等），则该块会被视为一个分组。该注释内容将作为分组的名称显示在列表中。

例如：

```http
### 
# 用户管理

###
# 获取所有用户
GET https://api.example.com/users

###
# 创建新用户
POST https://api.example.com/users
Content-Type: application/json

{
  "name": "测试用户"
}
```

在上面的例子中，"用户管理"会成为一个分组，包含"获取所有用户"和"创建新用户"两个请求。

### 请求名称

如果请求块（以`###`开始）的第一行有效内容是`#`开头的注释，该注释内容将优先作为请求在列表中的名称。

## 配置选项

您可以通过VS Code的用户或工作区设置来自定义此扩展的行为。搜索 "List HTTP Requests" 或直接修改 `settings.json`。

- `list-http.requestDisplay.showMethod`
  - **类型**: `boolean`
  - **默认值**: `true`
  - **描述**: 是否在请求名称旁边显示HTTP方法 (例如 `[GET]`)。

- `list-http.requestDisplay.methodPosition`
  - **类型**: `string`
  - **可选值**: `"prefix"`, `"suffix"`
  - **默认值**: `"prefix"`
  - **描述**: HTTP方法显示在请求名称之前 ('prefix') 或之后 ('suffix')。默认为 `'prefix'`。仅当 `showMethod` 为 `true` 时生效。

## 贡献

欢迎提交问题和建议到我们的[GitHub仓库](https://github.com/a11might/list-http)。
