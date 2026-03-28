// Global connections reference (passed from parent)
export const handleEndCall = (connections) => {
    try {
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }

        for (let peerId in connections) {
            connections[peerId].close();
        }

    } catch (e) {
        console.log("error while ending the call");
    }

    window.location.href = "/";
};
