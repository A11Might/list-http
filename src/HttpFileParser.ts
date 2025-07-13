import * as fs from 'fs';
import * as vscode from 'vscode';

export interface HttpRequestData {
    type: 'request';
    name: string; // 请求块的第一个有效行，或者方法+URL (作为备用或原始名称)
    commentName?: string; // 从请求块第一行'#'注释提取的名称，用于标签
    content: string;
    method?: string;
    url?: string;
    range: vscode.Range; // 请求定义的范围
}

export interface HttpGroupData {
    type: 'group';
    name: string; // 从###后的注释派生的名称
    range: vscode.Range; // 分组定义的范围
}

export type HttpParsedElement = HttpRequestData | HttpGroupData;

export class HttpFileParser {
    static async parseHttpFile(filePath: string): Promise<HttpParsedElement[]> {
        const fileContent = await fs.promises.readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n');
        const parsedElements: HttpParsedElement[] = [];

        let currentBlockRawLines: string[] = [];
        let blockStartLineNumber = -1;
        let blockEndLineNumber = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            if (line.startsWith('###')) {
                if (blockStartLineNumber !== -1) {
                    // 处理先前累积的块
                    blockEndLineNumber = i;
                    HttpFileParser.processBlock(currentBlockRawLines, blockStartLineNumber, blockEndLineNumber, parsedElements);
                }
                // 开始一个新块
                blockStartLineNumber = lineNumber;
                currentBlockRawLines = [];
                const textAfterMarker = line.substring(3).trim();
                if (textAfterMarker) {
                    currentBlockRawLines.push(textAfterMarker);
                }
            } else if (blockStartLineNumber !== -1) {
                // 我们在一个块内部，收集该行
                currentBlockRawLines.push(line);
            }
            // 此循环会有效忽略第一个'###'之前的行，
            // 如果根本没有找到'###'，则由回退逻辑处理它们。
        }

        // 循环结束后处理最后一个块
        if (blockStartLineNumber !== -1) {
            blockEndLineNumber = lines.length;
            HttpFileParser.processBlock(currentBlockRawLines, blockStartLineNumber, blockEndLineNumber, parsedElements);
        }

        // 回退逻辑：如果没有找到'###'分隔符且文件有内容，则将整个文件视为单个请求。
        if (parsedElements.length === 0 && fileContent.trim() !== '') {
            const content = fileContent.trim();
            const firstLineNumberInFile = HttpFileParser.findFirstNonEmptyLineNumber(lines);
            const range = new vscode.Range(new vscode.Position(firstLineNumberInFile - 1, 0), new vscode.Position(lines.length - 1, lines[lines.length - 1].length));

            let firstLineForName = '';
            const contentLines = content.split('\n');
            if (contentLines.length > 0) {
                firstLineForName = contentLines[0].trim();
            }

            const methodMatch = content.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(.+)$/im); // 检查整个内容

            parsedElements.push({
                type: 'request',
                name: firstLineForName || (methodMatch ? `${methodMatch[1]} ${methodMatch[2]}` : "未命名请求"),
                content: content,
                method: methodMatch ? methodMatch[1] : undefined,
                url: methodMatch ? methodMatch[2] : undefined,
                range: range
                // commentName 默认为 undefined
            });
        }

        return parsedElements;
    }

    private static findFirstNonEmptyLineNumber(fileLines: string[]): number {
        for (let i = 0; i < fileLines.length; i++) {
            if (fileLines[i].trim() !== '') {
                return i + 1;
            }
        }
        return 1; // 如果 fileContent.trim() 不为空，则不应到达此处
    }

    private static processBlock(rawBlockLines: string[], startLine: number, endLine: number, elements: HttpParsedElement[]) {
        const blockContent = rawBlockLines.join('\n').trim(); // 修剪整个收集到的块内容
        if (!blockContent) {
            return; // 忽略空块
        }

        const range = new vscode.Range(new vscode.Position(startLine - 1, 0), new vscode.Position(endLine - 1, 0));

        let firstMeaningfulLineInBlock = '';
        // 从构成块的原始行中找到第一个非空行
        for (const l of rawBlockLines) {
            const trimmedLine = l.trim();
            if (trimmedLine !== '') {
                firstMeaningfulLineInBlock = trimmedLine;
                break;
            }
        }
        // 如果在迭代 rawBlockLines 之后，firstMeaningfulLineInBlock 仍然为空，
        // 但 blockContent 不为空（例如 rawBlockLines 是 ["  ", "\t"]，连接后为 "  \t"，修剪后为空字符串前的 "  \t"），
        // 这意味着该块纯粹是空白。初始的 `if (!blockContent) return;` 会处理这种情况。
        // 如果 firstMeaningfulLineInBlock 为空，则表示所有原始行实际上都是空的。

        const httpMethodRegex = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(.+)$/im;
        const containsHttpMethod = httpMethodRegex.test(blockContent);

        if (firstMeaningfulLineInBlock.startsWith('#') && !containsHttpMethod) {
            // 这是一个分组
            const groupName = firstMeaningfulLineInBlock.substring(1).trim();
            elements.push({
                type: 'group',
                name: groupName || "未命名分组", // 确保组名不为空
                range: range
            });
        } else {
            // 这是一个请求
            let extractedCommentName: string | undefined = undefined;
            if (firstMeaningfulLineInBlock.startsWith('#')) {
                extractedCommentName = firstMeaningfulLineInBlock.substring(1).trim();
            }

            const methodMatchDetails = blockContent.match(httpMethodRegex); // 获取第一个方法匹配的详细信息

            // 请求的备用/原始名称
            let originalRequestName = firstMeaningfulLineInBlock;
            // 如果第一个有效行是注释，并且我们有HTTP方法，那么原始名称可能更适合是方法+URL
            // 但如果第一个有效行是注释，并且没有HTTP方法（虽然这理论上不应被视为请求），
            // 它的原始名称就是那个注释行。
            // 目前的逻辑是：如果 firstMeaningfulLineInBlock 为空，则尝试 method+url
            if (!originalRequestName && methodMatchDetails) {
                originalRequestName = `${methodMatchDetails[1]} ${methodMatchDetails[2]}`;
            } else if (!originalRequestName) {
                originalRequestName = "未命名请求";
            }
            // 如果 firstMeaningfulLineInBlock 本身是注释 (例如 "# 获取用户")，
            // 那么 originalRequestName 将是 "# 获取用户"。这作为备用名称是可接受的。

            elements.push({
                type: 'request',
                name: originalRequestName, // 备用/原始名称
                commentName: extractedCommentName, // 用于标签的特定注释
                content: blockContent,
                method: methodMatchDetails ? methodMatchDetails[1] : undefined,
                url: methodMatchDetails ? methodMatchDetails[2] : undefined,
                range: range
            });
        }
    }
}