import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { StyleSheet, Button, View } from "react-native";
import { useRef, forwardRef, useImperativeHandle } from "react";

const CameraView = forwardRef((props, ref) => {
    const camera = useRef<Camera>(null);

    const device = useCameraDevice("back");
    const { hasPermission } = useCameraPermission();

    useImperativeHandle(ref, () => ({
        takePicture: async () => {
            if (camera.current) {
                const photo = await camera.current.takePhoto();
                return photo;
            }
        },
    }));

    if (!hasPermission || !device) {
        return null;
    }

    return (
        <Camera
            style={{ ...StyleSheet.absoluteFillObject }}
            device={device}
            isActive={true}
            photo={true}
            ref={camera}
        />
    );
});

export default CameraView;