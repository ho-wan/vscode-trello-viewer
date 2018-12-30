import * as assert from 'assert';
import * as UserDataFolder from "../common/UserDataFolder";
// import * as extension from '../extension';

suite("settingsLocator", () => {
    let originalHome: string;
    let originalAppData: string;

    const userDataFolder = new UserDataFolder.UserDataFolder();

    suiteSetup(() => {
        originalHome = process.env.HOME || '';
        originalAppData = process.env.APPDATA || '';
    });

    suiteTeardown(() => {
        SetHome(originalHome);
        SetAppData(originalAppData);
    });

    test("if mac then is mac path", () => {
        SetPlatform('darwin');
        SetHome('/Users/user');

        let codePath = userDataFolder.getPathCodeSettings();
        console.log(codePath);
        assert.equal(codePath, "/Users/user/Library/Application Support/Code/User/")
    });

    test("if windows then is windows path", () => {
        SetPlatform('win32');
        //windows uses the appdata settings not the home
        SetAppData('C:\\Users\\User\\AppData\\Roaming');
        SetHome('');

        let codePath = userDataFolder.getPathCodeSettings();
        console.log(codePath);
        assert.equal(codePath, "C:\\Users\\User\\AppData\\Roaming\\Code\\User\\")
    });

    test("if linux then is linux path", () => {
        SetPlatform('linux');
        SetHome('/var/local');

        let codePath = userDataFolder.getPathCodeSettings();
        console.log(codePath);
        assert.equal(codePath, "/var/local/.config/Code/User/")
    });

});

function SetHome(home: string) {
    Object.defineProperty(process.env, 'HOME', {
        value: home
    });
}

function SetAppData(location: string) {
    Object.defineProperty(process.env, 'APPDATA', {
        value: location
    });
}

function SetPlatform(platform: string) {
    Object.defineProperty(process, 'platform', {
        value: platform
    });
}