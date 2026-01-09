import { Buffer } from "buffer";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import jpeg from "jpeg-js";
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
    ActivityIndicator, Dimensions, Image, ScrollView, Text,
    TouchableOpacity, View, Alert, StyleSheet, PanResponder, Animated
} from "react-native";

// --- AYARLAR ---
const CEVAP_ANAHTARI = {
    "1": "A", "2": "A", "3": "B", "4": "C", "5": "D",
    "6": "A", "7": "C", "8": "A", "9": "D", "10": "C",
    "11": "A", "12": "B", "13": "C", "14": "B", "15": "C"
};

// --- MATEMATİK MOTORU ---
function b64ToU8(b64) {
    const buf = Buffer.from(b64, "base64");
    return new Uint8Array(buf);
}

function grayAt(rgba, w, h, x, y) {
    const xx = Math.floor(Math.max(0, Math.min(w - 1, x)));
    const yy = Math.floor(Math.max(0, Math.min(h - 1, y)));
    const i = (yy * w + xx) * 4;
    return 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
}

function regionMeanGray(rgba, w, h, cx, cy, r) {
    let sum = 0, cnt = 0;
    const rr = r * r;
    const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r);
    const y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);

    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            if ((x - cx) ** 2 + (y - cy) ** 2 <= rr) {
                sum += grayAt(rgba, w, h, x, y);
                cnt++;
            }
        }
    }
    return cnt ? sum / cnt : 255;
}

function getProjectedPoint(corners, u, v) {
    const { tl, tr, bl, br } = corners;
    const topX = tl.x + (tr.x - tl.x) * u;
    const topY = tl.y + (tr.y - tl.y) * u;
    const botX = bl.x + (br.x - bl.x) * u;
    const botY = bl.y + (br.y - bl.y) * u;
    const x = topX + (botX - topX) * v;
    const y = topY + (botY - topY) * v;
    return { x, y };
}

// --- AKILLI KÖŞE BULUCU (Auto-Detect Markers) ---
function findSmartCorner(rgba, w, h, corner) {
    const W2 = Math.floor(w / 2);
    const H2 = Math.floor(h / 2);

    let startX = 0, endX = W2, startY = 0, endY = H2;
    if (corner === "tr") { startX = W2; endX = w; }
    if (corner === "bl") { startY = H2; endY = h; }
    if (corner === "br") { startX = W2; endX = w; startY = H2; endY = h; }

    const step = 4;
    const threshold = 100;

    let bestX = 0, bestY = 0, maxScore = 0;

    for (let y = startY; y < endY; y += step) {
        for (let x = startX; x < endX; x += step) {
            if (grayAt(rgba, w, h, x, y) < threshold) {
                let boxScore = 0;
                const boxSize = 10;
                for (let by = -boxSize; by <= boxSize; by += 5) {
                    for (let bx = -boxSize; bx <= boxSize; bx += 5) {
                        if (grayAt(rgba, w, h, x + bx, y + by) < threshold) boxScore++;
                    }
                }
                if (boxScore > maxScore) {
                    maxScore = boxScore;
                    bestX = x;
                    bestY = y;
                }
            }
        }
    }

    if (maxScore < 5) return null;
    return { x: bestX, y: bestY };
}

// --- DRAGGABLE HANDLE COMPONENT ---
const DraggablePoint = ({ initialPos, onDrag, color = "#00ff00" }) => {
    const pan = useRef(new Animated.ValueXY({ x: initialPos.x, y: initialPos.y })).current;

    useEffect(() => {
        pan.setValue({ x: initialPos.x, y: initialPos.y });
    }, [initialPos]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value,
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (e, gesture) => {
                Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(e, gesture);
                onDrag({
                    x: pan.x._offset + gesture.dx,
                    y: pan.y._offset + gesture.dy
                });
            },
            onPanResponderRelease: () => {
                pan.flattenOffset();
            },
        })
    ).current;

    return (
        <Animated.View
            style={{
                transform: [{ translateX: pan.x }, { translateY: pan.y }],
                position: 'absolute',
                top: -20, left: -20,
                width: 40, height: 40,
                justifyContent: 'center', alignItems: 'center',
                zIndex: 999
            }}
            {...panResponder.panHandlers}
        >
            <View style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: color, borderWidth: 2, borderColor: '#fff',
                shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 2
            }} />
            <View style={{ position: 'absolute', width: 40, height: 1, backgroundColor: color, opacity: 0.5 }} />
            <View style={{ position: 'absolute', width: 1, height: 40, backgroundColor: color, opacity: 0.5 }} />
        </Animated.View>
    );
};

// --- REACT UI ---
export default function StandaloneOMR({ route }) {
    if (typeof globalThis !== 'undefined') {
        globalThis.Buffer = globalThis.Buffer || Buffer;
    }

    const { qCount: rawQCount } = route?.params || {};
    const qCount = useMemo(() => Math.max(1, Number(rawQCount || "15")), [rawQCount]);

    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState(null);

    const [step, setStep] = useState("camera");
    const [imageUri, setImageUri] = useState(null);
    const [imgDims, setImgDims] = useState(null);
    const [viewDims, setViewDims] = useState(null);
    const [corners, setCorners] = useState(null);
    const [imageData, setImageData] = useState(null);
    const [answers, setAnswers] = useState(null);
    const [score, setScore] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!permission) requestPermission();
    }, [permission]);

    // RESİM İŞLEME VE KÖŞE ARAMA
    const handleImage = async (uri) => {
        setLoading(true);
        try {
            const manip = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 800 } }],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            const screenW = Dimensions.get("window").width;
            const scale = screenW / manip.width;
            const viewH = manip.height * scale;

            setImageUri(manip.uri);
            setImgDims({ w: manip.width, h: manip.height });
            setViewDims({ w: screenW, h: viewH });

            const bytes = b64ToU8(manip.base64);
            const decoded = jpeg.decode(bytes, { useTArray: true });
            setImageData({ data: decoded.data, w: decoded.width, h: decoded.height });

            const tl = findSmartCorner(decoded.data, decoded.width, decoded.height, "tl");
            const tr = findSmartCorner(decoded.data, decoded.width, decoded.height, "tr");
            const bl = findSmartCorner(decoded.data, decoded.width, decoded.height, "bl");
            const br = findSmartCorner(decoded.data, decoded.width, decoded.height, "br");

            if (tl && tr && bl && br) {
                setCorners({
                    tl: { x: tl.x * scale, y: tl.y * scale },
                    tr: { x: tr.x * scale, y: tr.y * scale },
                    bl: { x: bl.x * scale, y: bl.y * scale },
                    br: { x: br.x * scale, y: br.y * scale }
                });
                Alert.alert("Başarılı", "Köşeler otomatik bulundu! Doğruysa 'TARA' tuşuna basın.");
            } else {
                const margin = 40;
                setCorners({
                    tl: { x: margin, y: margin },
                    tr: { x: screenW - margin, y: margin },
                    bl: { x: margin, y: viewH - margin },
                    br: { x: screenW - margin, y: viewH - margin }
                });
                Alert.alert("Bilgi", "Otomatik köşe bulunamadı. Lütfen yeşil noktaları siyah karelerin üzerine sürükleyin.");
            }

            setStep("crop");
        } catch (e) {
            Alert.alert("Hata", "Resim işlenemedi");
        } finally {
            setLoading(false);
        }
    };

    const takePhoto = async () => {
        if (cameraRef) {
            const p = await cameraRef.takePictureAsync({ quality: 0.8 });
            handleImage(p.uri);
        }
    };

    const pickImage = async () => {
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (!r.canceled) handleImage(r.assets[0].uri);
    };

    const runAnalysis = () => {
        if (!imageData || !corners || !viewDims || !imgDims) return;
        setLoading(true);

        setTimeout(() => {
            try {
                const scale = imgDims.w / viewDims.w;
                const pixelCorners = {
                    tl: { x: corners.tl.x * scale, y: corners.tl.y * scale },
                    tr: { x: corners.tr.x * scale, y: corners.tr.y * scale },
                    bl: { x: corners.bl.x * scale, y: corners.bl.y * scale },
                    br: { x: corners.br.x * scale, y: corners.br.y * scale }
                };

                const result = analyzeOMR(imageData.data, imageData.w, imageData.h, pixelCorners, qCount);

                setAnswers(result.answers);
                calculateScore(result.answers);
                setStep("result");

            } catch (e) {
                Alert.alert("Hata", e.message);
            } finally {
                setLoading(false);
            }
        }, 100);
    };

    const analyzeOMR = (rgba, w, h, c, qCount) => {
        const answers = {};
        const options = ["A", "B", "C", "D"];

        const colPositions = [0.27, 0.44, 0.61, 0.78];
        const rowStart = 0.14;
        const rowEnd = 0.94;
        const rowHeight = (rowEnd - rowStart) / (qCount - 1);

        const markerW = Math.abs(c.tr.x - c.tl.x);
        const radius = markerW * 0.025;

        for (let q = 0; q < qCount; q++) {
            const v = rowStart + (q * rowHeight);
            let minVal = 255;
            let minIdx = -1;
            let vals = [];

            options.forEach((opt, idx) => {
                const u = colPositions[idx];
                const pt = getProjectedPoint(c, u, v);
                const val = regionMeanGray(rgba, w, h, pt.x, pt.y, radius);
                vals.push(val);
                if (val < minVal) { minVal = val; minIdx = idx; }
            });

            const sorted = [...vals].sort((a, b) => a - b);
            if (sorted[0] < 180 && (sorted[1] - sorted[0] > 10)) {
                answers[(q + 1).toString()] = options[minIdx];
            } else {
                answers[(q + 1).toString()] = null;
            }
        }
        return { answers };
    };

    const calculateScore = (userAns) => {
        let c = 0, w = 0, e = 0;
        Object.keys(userAns).forEach(k => {
            const u = userAns[k];
            const r = CEVAP_ANAHTARI[k];
            if (!u) e++; else if (u === r) c++; else w++;
        });
        setScore({ correct: c, wrong: w, empty: e });
    };

    const renderGridPreview = () => {
        if (!corners || !viewDims) return null;
        const dots = [];
        const colPositions = [0.27, 0.44, 0.61, 0.78];
        const rowStart = 0.14;
        const rowEnd = 0.94;
        const rowHeight = (rowEnd - rowStart) / (qCount - 1);

        for (let q = 0; q < qCount; q++) {
            const v = rowStart + (q * rowHeight);
            for (let i = 0; i < 4; i++) {
                const u = colPositions[i];
                const pt = getProjectedPoint(corners, u, v);
                dots.push(
                    <View key={`${q}-${i}`} style={{
                        position: 'absolute',
                        left: pt.x - 2, top: pt.y - 2,
                        width: 4, height: 4, borderRadius: 2,
                        backgroundColor: 'cyan', opacity: 0.6
                    }} />
                );
            }
        }
        return dots;
    };

    if (step === "camera") {
        return (
            <CameraView ref={setCameraRef} style={{ flex: 1 }} facing="back">
                <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 }}>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 30 }}>Optik Formu Çek</Text>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                        <TouchableOpacity onPress={takePhoto} style={styles.bigBtn}><View style={styles.innerBtn} /></TouchableOpacity>
                        <TouchableOpacity onPress={pickImage} style={styles.smallBtn}><Text style={{ color: 'white' }}>Galeri</Text></TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        );
    }

    if (step === "crop" && imageUri && viewDims && corners) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black' }}>
                <ScrollView contentContainerStyle={{ width: viewDims.w, height: viewDims.h, marginTop: 50, position: 'relative' }}>
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />

                    {renderGridPreview()}

                    <DraggablePoint initialPos={corners.tl} color="#00ff00" onDrag={(p) => setCorners(prev => ({ ...prev, tl: p }))} />
                    <DraggablePoint initialPos={corners.tr} color="#00ff00" onDrag={(p) => setCorners(prev => ({ ...prev, tr: p }))} />
                    <DraggablePoint initialPos={corners.bl} color="#00ff00" onDrag={(p) => setCorners(prev => ({ ...prev, bl: p }))} />
                    <DraggablePoint initialPos={corners.br} color="#00ff00" onDrag={(p) => setCorners(prev => ({ ...prev, br: p }))} />
                </ScrollView>

                <View style={{ position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' }}>
                    <Text style={{ color: 'white', marginBottom: 10, fontWeight: 'bold' }}>Yeşil noktaları SİYAH KARELERE oturtun</Text>
                    <TouchableOpacity onPress={runAnalysis} style={styles.actionBtn}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTxt}>TARA VE OKU</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50, alignItems: 'center' }}>
            <Text style={styles.title}>Sonuçlar</Text>

            {score && (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                    <View style={[styles.card, { backgroundColor: '#dcfce7' }]}><Text style={{ color: '#166534', fontSize: 24, fontWeight: 'bold' }}>{score.correct}</Text><Text>Doğru</Text></View>
                    <View style={[styles.card, { backgroundColor: '#fee2e2' }]}><Text style={{ color: '#991b1b', fontSize: 24, fontWeight: 'bold' }}>{score.wrong}</Text><Text>Yanlış</Text></View>
                    <View style={[styles.card, { backgroundColor: '#f3f4f6' }]}><Text style={{ color: '#374151', fontSize: 24, fontWeight: 'bold' }}>{score.empty}</Text><Text>Boş</Text></View>
                </View>
            )}

            {answers && (
                <View style={styles.grid}>
                    {Object.entries(answers).map(([q, ans]) => (
                        <View key={q} style={styles.row}>
                            <Text style={{ fontWeight: 'bold', width: 30 }}>{q}.</Text>
                            <Text style={{
                                color: !ans ? 'gray' : (ans === CEVAP_ANAHTARI[q] ? 'green' : 'red'),
                                fontWeight: 'bold'
                            }}>
                                {ans ? String(ans) : "Boş"}
                            </Text>
                            {ans && ans !== CEVAP_ANAHTARI[q] && (
                                <Text style={{ color: 'green', marginLeft: 5, fontSize: 12 }}>({CEVAP_ANAHTARI[q]})</Text>
                            )}
                        </View>
                    ))}
                </View>
            )}

            <TouchableOpacity onPress={() => setStep("camera")} style={[styles.actionBtn, { marginTop: 30 }]}>
                <Text style={styles.btnTxt}>YENİ TARAMA</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    bigBtn: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
    innerBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white' },
    smallBtn: { padding: 15, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10 },
    actionBtn: { backgroundColor: '#2563eb', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
    btnTxt: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    card: { padding: 15, borderRadius: 10, alignItems: 'center', minWidth: 80 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
    row: { width: '28%', flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' }
});
