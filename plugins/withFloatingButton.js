const { withMainApplication, withAndroidManifest } = require('@expo/config-plugins');

// MainApplication.kt 에 패키지 자동 주입
const withFloatingButtonMainApp = (config) => {
    return withMainApplication(config, (mod) => {
        let contents = mod.modResults.contents;

        // import 추가
        if (!contents.includes('import com.richcompany.fishlineapp.FloatingButtonPackage')) {
            contents = contents.replace(
                'import expo.modules.ReactNativeHostWrapper',
                'import expo.modules.ReactNativeHostWrapper\nimport com.richcompany.fishlineapp.FloatingButtonPackage'
            );
        }

        // getPackages 수정
        if (!contents.includes('FloatingButtonPackage()')) {
            contents = contents.replace(
                'PackageList(this).packages.apply {',
                'PackageList(this).packages.apply {\n              add(FloatingButtonPackage())'
            );
        }

        mod.modResults.contents = contents;
        return mod;
    });
};

// AndroidManifest.xml 에 서비스 + 권한 자동 주입
const withFloatingButtonManifest = (config) => {
    return withAndroidManifest(config, (mod) => {
        const manifest = mod.modResults.manifest;

        // 권한 추가
        const permissions = manifest['uses-permission'] || [];
        const addPerm = (name) => {
            if (!permissions.find(p => p.$['android:name'] === name)) {
                permissions.push({ $: { 'android:name': name } });
            }
        };
        addPerm('android.permission.FOREGROUND_SERVICE');
        addPerm('android.permission.FOREGROUND_SERVICE_SPECIAL_USE');
        addPerm('android.permission.SYSTEM_ALERT_WINDOW');
        manifest['uses-permission'] = permissions;

        // 서비스 추가
        const application = manifest.application[0];
        if (!application.service) application.service = [];
        const hasService = application.service.find(
            s => s.$['android:name'] === '.FloatingButtonService'
        );
        if (!hasService) {
            application.service.push({
                $: {
                    'android:name': '.FloatingButtonService',
                    'android:foregroundServiceType': 'specialUse',
                    'android:exported': 'false',
                },
                property: [{
                    $: {
                        'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
                        'android:value': 'floatingButton',
                    }
                }]
            });
        }

        return mod;
    });
};

module.exports = (config) => {
    config = withFloatingButtonMainApp(config);
    config = withFloatingButtonManifest(config);
    return config;
};