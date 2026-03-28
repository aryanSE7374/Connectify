// Media Toggle System

// NOTE : 

// MediaStream => container : Multiple video/audio tracks
// Tracks => actual data (video/audio)

/*
// media controls : 
to turn camera OFF tow ways:

    1. stop track (NOT IDEAL)
        - peer connection loses video sender
        - requires renegotiation
        - need getUserMedia AGAIN
        - complex + expensive
        -+-> use this only when User leaves meeting -> cleanup -> release resources

    2. track.enabled = false (correct)
        - keeps track alive
        - just muting video
        - No renogotiation
        - instant toggle
        - connection stays intact

    
    outcome : This keeps the RTCPeerConnection stable and avoids unnecessary SDP renegotiation.

*/

// video toggle handler
export const handleVideo = (video, setVideo) => {
    if (!window.localStream) return;

    window.localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
    });

    setVideo(prev => !prev);
};

// audio toggle handler
export const handleAudio = (audio, setAudio) => {
    if (!window.localStream) return;

    window.localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
    });

    setAudio(prev => !prev);
};
