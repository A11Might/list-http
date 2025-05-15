const esbuild = require('esbuild');

async function build() {
    const args = process.argv.slice(2);
    const watch = args.includes('--watch');
    const minify = args.includes('--minify');
    const sourcemap = args.includes('--sourcemap');

    const options = {
        entryPoints: ['src/extension.ts'], // 您的扩展入口文件
        bundle: true,
        outfile: 'out/extension.js',     // 输出文件路径，与 package.json 中的 main 字段一致
        platform: 'node',                // 目标平台
        target: 'node14',                // 与您的 @types/node 版本（14.x）匹配
        external: ['vscode'],            // vscode 模块是运行时提供的，需要排除
        format: 'cjs',                   // VS Code 扩展通常使用 CommonJS 格式
        minify: minify,
        sourcemap: sourcemap,
        // 可选：如果您有其他需要处理的 loader，可以在这里添加
        // loader: {
        //   '.json': 'json', // 例如，如果您直接导入json文件
        // },
    };

    try {
        if (watch) {
            const context = await esbuild.context(options);
            await context.watch();
            console.log('Watching for changes...');
        } else {
            await esbuild.build(options);
            console.log('Build successful!');
        }
    } catch (e) {
        console.error('Build failed:', e);
        process.exit(1);
    }
}

build(); 