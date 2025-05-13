import * as fs from 'fs';

export interface HttpRequest {
    name: string;
    content: string;
    method?: string;
    url?: string;
    lineNumber: number;
}

export class HttpFileParser {
    static async parseHttpFile(filePath: string): Promise<HttpRequest[]> {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const requests: HttpRequest[] = [];

        // 保存文件的所有行，用于精确定位
        const allLines = content.split('\n');

        // 标记每个请求的起始位置
        const allContent = content;
        const requestMarkers: { start: number, end: number }[] = [];

        // 找出所有的分隔符位置
        let regex = /^###/mg;
        let match;
        let markers: number[] = [];

        while ((match = regex.exec(allContent)) !== null) {
            markers.push(match.index);
        }

        // 确定每个请求块的起始和结束位置
        if (markers.length === 0) {
            // 如果没有分隔符，整个文件就是一个请求
            if (allContent.trim()) {
                requestMarkers.push({ start: 0, end: allContent.length });
            }
        } else {
            // 处理第一个请求块（如果分隔符前有内容）
            if (markers[0] > 0) {
                requestMarkers.push({ start: 0, end: markers[0] });
            }

            // 处理中间的请求块
            for (let i = 0; i < markers.length; i++) {
                const start = markers[i];
                const end = i < markers.length - 1 ? markers[i + 1] : allContent.length;
                requestMarkers.push({ start, end });
            }
        }

        // 解析每个请求块
        for (const marker of requestMarkers) {
            const blockContent = allContent.substring(marker.start, marker.end);
            if (!blockContent.trim()) continue;

            // 计算请求开始的行号
            let lineNumber = 1;
            for (let i = 0; i < marker.start; i++) {
                if (allContent[i] === '\n') {
                    lineNumber++;
                }
            }

            // 跳过分隔符行，如果这是以###开头的块
            const firstLineOfBlock = blockContent.split('\n')[0].trim();
            if (firstLineOfBlock.startsWith('###')) {
                lineNumber++;

                // 跳过空行
                let contentLines = blockContent.split('\n');
                for (let i = 1; i < contentLines.length; i++) {
                    if (contentLines[i].trim()) {
                        lineNumber += i;
                        break;
                    }
                }
            }

            // 提取请求内容
            let content = blockContent;
            if (firstLineOfBlock.startsWith('###')) {
                // 去掉分隔符行
                content = blockContent.split('\n').slice(1).join('\n').trim();
            }

            // 跳过空的请求块
            if (!content.trim()) continue;

            // 提取第一行用于显示
            const lines = content.split('\n').map(line => line.trim()).filter(line => line);
            if (lines.length === 0) continue;

            const firstLine = lines[0];
            const methodMatch = firstLine.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(.+)$/i);

            const request: HttpRequest = {
                name: firstLine,
                content: content,
                method: methodMatch ? methodMatch[1] : undefined,
                url: methodMatch ? methodMatch[2] : undefined,
                lineNumber: lineNumber
            };

            requests.push(request);
        }

        return requests;
    }
} 