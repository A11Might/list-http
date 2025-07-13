# Change Log

All notable changes to the "list-http" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Released]

## [0.0.6] - 2025-07-13
### Added
- **双向绑定**: 现在当光标在 `.http` 文件中移动到某个请求的范围内时，侧边栏对应的请求项会自动高亮显示。

### Changed
- **导航跳转优化**: 点击侧边栏的请求项进行跳转时，如果目标位置已经在屏幕上可见，则不再滚动屏幕，行为与 VS Code 内置的 Outline 视图保持一致。

## [0.0.5] - 2025-06-13
### Fixed
- 修复了在分栏情况下点击请求导航时的问题，现在会正确地在已存在的编辑器中导航，而不会重复打开文件。

## [0.0.4] - 2025-06-12
### Fixed
- 修复了在分栏中点击请求导航时重新打开文件的问题，现在会直接跳转到已打开的文件并导航到对应请求。

## [0.0.3] - 2025-05-15
### Changed
- 将请求项中HTTP方法的默认显示位置从后缀 (`suffix`) 更改为前缀 (`prefix`)。

## [0.0.2] - 2025-05-14
### Added
- 请求分组功能：如果 `###` 分隔的块中第一行有效内容为 `# 注释` 且块内无HTTP方法，则视为分组。
- 请求命名优化：请求列表中的名称现在优先使用 `###` 块下第一行 `# 注释` 的内容。
- 自定义显示样式：增加了两个配置项，允许用户自定义请求项的显示样式：
  - `list-http.requestDisplay.showMethod`: 控制是否显示HTTP方法。
  - `list-http.requestDisplay.methodPosition`: 控制HTTP方法相对于名称显示的位置（前缀或后缀）。

### Changed
- 更新了文件解析逻辑以支持新的分组和命名规则。

## [0.0.1] - 2025-05-13
### Added
- 初始版本发布
- 支持基本的HTTP请求列表功能
- 实现请求导航功能