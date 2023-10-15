import _ from "lodash";

export function generatePass() {
    let pass = "";
    let str = [
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "abcdefghijklmnopqrstuvwxyz",
        "0123456789",
        "!@#$%",
    ];

    for (let i = 1; i <= 4; i++) {
        let index = Math.floor(Math.random() * str[0].length);
        pass += str[0].charAt(index);
        index = Math.floor(Math.random() * str[1].length);
        pass += str[1].charAt(index);
        index = Math.floor(Math.random() * str[2].length);
        pass += str[2].charAt(index);
        index = Math.floor(Math.random() * str[3].length);
        pass += str[3].charAt(index);
    }
    pass = _.shuffle(pass).join("");
    pass = pass.substring(0, Math.random() * 6 + 6);
    console.log(pass);
    return pass;
}
