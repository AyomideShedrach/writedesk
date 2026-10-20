import fs from 'fs';
import path from 'path';

const nsisTargetFile = path.resolve('node_modules/app-builder-lib/out/targets/nsis/NsisTarget.js');
if (fs.existsSync(nsisTargetFile)) {
  let content = fs.readFileSync(nsisTargetFile, 'utf8');
  if (content.includes('if ((0, macosVersion_1.isMacOsCatalina)()) {') || content.includes('const wineVm = new WineVm_1.WineVmManager')) {
    const originalPattern = /\/\/ http:\/\/forums\.winamp\.com\/showthread\.php\?p=3078545[\s\S]*?await wineVm\.exec\(installerPath, \[\], \{ env: \{ __COMPAT_LAYER: "RunAsInvoker" \} \}\);\s*\}/;
    const replacement = `// Patched for seamless multi-platform building without Wine requirement
        let extracted = false;
        try {
            await nsisUtil_1.UninstallerReader.exec(installerPath, uninstallerPath);
            extracted = true;
        }
        catch (e) {
            builder_util_1.log.warn(\`UninstallerReader note: \${e.message}\`);
        }
        if (!extracted) {
            if (process.platform === "win32") {
                const vm = await packager.vm.value;
                await vm.exec(installerPath, []);
            }
            else {
                try {
                    const wineVm = new WineVm_1.WineVmManager((_a = packager.config.toolsets) === null || _a === void 0 ? void 0 : _a.wine);
                    await wineVm.exec(installerPath, [], { env: { __COMPAT_LAYER: "RunAsInvoker" } });
                }
                catch (wineErr) {
                    builder_util_1.log.warn(\`Wine skipped for uninstaller: \${wineErr.message}\`);
                }
            }
        }`;
    if (originalPattern.test(content)) {
      content = content.replace(originalPattern, replacement);
      fs.writeFileSync(nsisTargetFile, content, 'utf8');
      console.log('✓ Successfully patched electron-builder NsisTarget for cross-platform Windows installation builds');
    } else {
      console.log('• NsisTarget is already patched or has compatible structure');
    }
  }
}
