import mongoose from "mongoose";

//Room Schema and Model
const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    theme: {
        type: String,
        required: true
    },
    players: [{
        socketId: String,
        nickname: String,
        ready: {
            type: Boolean,
            default: false
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Room = mongoose.model("Room", roomSchema);
export default Room;