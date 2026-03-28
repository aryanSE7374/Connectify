// resotre camera
export const restoreCamera = async (audioAvailable, localVideoref, connections) => {
    const camStream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: audioAvailable 
    });
    const camTrack = camStream.getVideoTracks()[0];

    for (let peerId in connections) {
        const sender = connections[peerId]
            .getSenders()
            .find(s => s.track?.kind === "video");

        if (sender) {
            await sender.replaceTrack(camTrack);
        }
    }

    // FIX: Null safety check
    if (localVideoref.current) {
        localVideoref.current.srcObject = camStream;
    }
    window.localStream = camStream;
};

// screen toggle handler
// getDisplayMedia() : prompts the user to select and grant permission to capture the contents of a display as a MediaStream
export const handleScreenShare = async (screenTrackRef, screen, setScreen, localVideoref, audioAvailable, connections) => { // async because getDisplayMedia() returns promise
    
    // CASE 1: STOP FLOW (MANUAL BUTTON)
    if (screenTrackRef.current) {
        console.log("Stopping screen share manually");

        const oldTrack = screenTrackRef.current;

        setScreen(false);
        screenTrackRef.current = null; // INPORTANT to nullify the screenTrackRef

        // Replace FIRST (important)
        await restoreCamera(audioAvailable, localVideoref, connections);

        // Then stop
        oldTrack.stop();

        return;
    }

    // CASE 2: Start sharing
    // START FLOW
    if (!navigator.mediaDevices.getDisplayMedia) {
        console.log("Screen share not supported");
        return;
    }

    /*
    
    RTCPeerConnection = Full call session
    RTCRtpSender : This is the ACTUAL media pipeline (one per track)
    each sender : - Sends ONE track and Has control over that track
        RTCPeerConnection
            |
            +-- Sender (video track)
            +-- Sender (audio track)

    */

    try {
        // Save original audio tracks BEFORE switching streams
        const originalAudioTracks = window.localStream?.getAudioTracks() || [];

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true
        });

        const screenTrack = screenStream.getVideoTracks()[0]; // why 0 index? 
        // in screen, usually only one video Track is created and hence, it gets the first (and only) video track

        screenTrackRef.current = screenTrack; 
        // FIX: Store track → used for stopping later

        setScreen(true);

        // ✅ Add original audio back to screen stream
        originalAudioTracks.forEach(track => {
            screenStream.addTrack(track);
        });

        console.log("Screen track obtained");

        // Replace track in all peer connections
        for (let peerId in connections) {
            const pc = connections[peerId];

            // pc.getSenders() : Returns list of RTCRtpSender (sender = object responsible for sending media)

            const sender = pc.getSenders().find(s => s.track && s.track.kind === "video");

            if (sender) {
                // await added to ensure stable switch, no race condition
                await sender.replaceTrack(screenTrack); // Camera -> replaced by Screen
            }
        }

        // Update local preview
        if (localVideoref.current) {
            localVideoref.current.srcObject = screenStream;
        }

        window.localStream = screenStream; // because later - handleVideo / handleAudio depends on localStream

        // CASE 3: (Browser BUtton)
        // Handle when user stops sharing
        screenTrack.onended = async () => {
            console.log("Screen sharing stopped");

            if ( !screenTrackRef.current ) return;

            screenTrackRef.current = null;
            setScreen(false);

            await restoreCamera(audioAvailable, localVideoref, connections); 
            // FIX: Reuse same logic → no duplication
        };

        // Update local preview - earlier HERE, SHIFTED ABOVE

    } catch (err) {
        console.error("Screen share error:", err);
        screenTrackRef.current = null; 
        // FIX: Clean state on failure
    }
};
