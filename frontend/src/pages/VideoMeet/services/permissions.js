// get permissions system
// ISSUE1 : Double permission request inefficient
// ISSUE2 : Using state immediately after setting it is unsafe
export const getPermissions = async (setVideoAvailable, setAudioAvailable, setScreenAvailable, localVideoref) => {
    // FIX 1 
    // tryna fix the issues - there's still some issues (LATER)
    try {
    // Request both camera & mic in one call
        // navigator.mediaDevices is the browser API for camera/mic/screen
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        // If we reach here, permission granted
        // NOTE : it assumes that both the permissions are given and, 
        // hence if the mic permission is not given, the camera preview is not visible
        setVideoAvailable(true);
        setAudioAvailable(true);

        // Attach preview
        window.localStream = stream;

        if (localVideoref.current) { 
            localVideoref.current.srcObject = stream;
        }

    } catch (err) {
        console.log("Camera/Mic permission denied:", err);

        // If error, mark unavailable
        setVideoAvailable(false);
        setAudioAvailable(false);
    }

    // Screen share support check (no permission request here)
    if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
    } else {
        setScreenAvailable(false);
    }
};
