export function generateRoomCode() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    // console.log(code);
    return code;
}
