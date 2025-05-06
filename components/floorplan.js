import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/FontAwesome';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SHAPES = [
  { type: 'circle', icon: 'circle', color: '#ffa', label: 'Circle' },
  { type: 'square', icon: 'square', color: '#aff', label: 'Square' },
  { type: 'triangle', icon: 'play', color: '#faf', label: 'Triangle' },
  { type: 'person', icon: 'user', color: '#afa', label: 'Person' },
  { type: 'camera', icon: 'camera', color: '#faa', label: 'Camera' },
  { type: 'tree', icon: 'tree', color: '#afd', label: 'Tree' },
  { type: 'car', icon: 'car', color: '#fad', label: 'Car' },
  { type: 'bed', icon: 'bed', color: '#fdf', label: 'Bed' },
  { type: 'tv', icon: 'tv', color: '#ddd', label: 'TV' },
  { "type": "light", "icon": "lightbulb-o", "color": "#ffe066", "label": "Light" },
  { "type": "mic", "icon": "microphone", "color": "#d3cce3", "label": "Mic" },
  { "type": "monitor", "icon": "desktop", "color": "#ccc", "label": "Monitor" },
  { "type": "crew", "icon": "users", "color": "#a2d5f2", "label": "Crew" },
  { "type": "speaker", "icon": "volume-up", "color": "#dff", "label": "Speaker" },
  { "type": "table", "icon": "cutlery", "color": "#e0bbE4", "label": "Table" },
  { "type": "power", "icon": "plug", "color": "#ffcccb", "label": "Power Source" },
  { "type": "fire-ext", "icon": "fire-extinguisher", "color": "#ff595e", "label": "Fire Ext." },
  { "type": "bathroom", "icon": "bath", "color": "#bee3db", "label": "Bathroom" },
  { "type": "clock", "icon": "clock-o", "color": "#d0f4de", "label": "Clock" },
  { "type": "stairs", "icon": "sort-amount-asc", "color": "#a0ced9", "label": "Stairs" },
  { "type": "chair", "icon": "wheelchair", "color": "#d291bc", "label": "Chair" },
  { "type": "window", "icon": "columns", "color": "#b5ead7", "label": "Window" },
  { "type": "drink", "icon": "coffee", "color": "#dec3c3", "label": "Drink" },
  { "type": "blood", "icon": "tint", "color": "#900", "label": "Blood" },
  { "type": "corpse", "icon": "user-slash", "color": "#555", "label": "Corpse" },
  { "type": "knife", "icon": "cut", "color": "#c33", "label": "Knife" },
  { "type": "doll", "icon": "child", "color": "#cfc", "label": "Creepy Doll" },
  { "type": "mirror", "icon": "circle-o", "color": "#ccd", "label": "Haunted Mirror" },
  { "type": "coffin", "icon": "archive", "color": "#222", "label": "Coffin" },
  { "type": "candles", "icon": "fire", "color": "#ffdf91", "label": "Candles" },
  { "type": "pentagram", "icon": "star", "color": "#800080", "label": "Sigil" },
  { "type": "chains", "icon": "link", "color": "#aaa", "label": "Chains" },
  { "type": "script", "icon": "file-text-o", "color": "#ffe4e1", "label": "Script" },
  { "type": "console", "icon": "gamepad", "color": "#0ff", "label": "Control Console" },
  { "type": "beam", "icon": "arrow-up", "color": "#ff0", "label": "Tractor Beam" },
  { "type": "pod", "icon": "cube", "color": "#aaaaff", "label": "Cryo Pod" },
  { "type": "laser", "icon": "bolt", "color": "#f0f", "label": "Laser" },
  { "type": "antenna", "icon": "wifi", "color": "#9ef", "label": "Antenna" },
  { "type": "ai-core", "icon": "database", "color": "#fcf", "label": "AI Core" },
  { "type": "alien-egg", "icon": "ellipsis-h", "color": "#6f6", "label": "Alien Egg" },
  { "type": "sword", "icon": "gavel", "color": "#ccc", "label": "Sword" },
  { "type": "shield", "icon": "shield", "color": "#88f", "label": "Shield" },
  { "type": "torch", "icon": "fire", "color": "#f80", "label": "Torch" },
  { "type": "scroll", "icon": "file-text-o", "color": "#f5deb3", "label": "Scroll" },
  { "type": "cauldron", "icon": "flask", "color": "#4b4", "label": "Cauldron" },
  { "type": "book", "icon": "book", "color": "#deb887", "label": "Spellbook" },
  { "type": "altar", "icon": "cube", "color": "#ccc", "label": "Altar" },
  { "type": "flag", "icon": "flag", "color": "#b00", "label": "Banner" },
  { "type": "makeup", "icon": "paint-brush", "color": "#ffd6a5", "label": "Makeup" },
  { "type": "wardrobe", "icon": "shopping-bag", "color": "#d6e2e9", "label": "Wardrobe" },
  { "type": "props", "icon": "archive", "color": "#eaeaea", "label": "Props" }
];

const generateRandomColor = () => {
  // Generate pastel colors by mixing with white
  const hue = Math.floor(Math.random() * 360);
  const saturation = 25 + Math.floor(Math.random() * 30); // 25-55%
  const lightness = 65 + Math.floor(Math.random() * 20); // 65-85%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const Floorplan = ({ navigation }) => {
  const [shapes, setShapes] = useState([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [paths, setPaths] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const nextId = useSharedValue(1);

  const handleDropShape = (x, y, type) => {
    if (x > 0 && x < SCREEN_WIDTH && y < SCREEN_HEIGHT) {
      const newShape = {
        id: nextId.value++,
        type,
        x: x,
        y: y,
        width: 50,
        height: 50,
        rotation: 0,
        color: generateRandomColor(),
      };
      setShapes((prev) => [...prev, newShape]);
    }
  };

  const handleDeleteLastShape = () => {
    console.log('Deleting last shape, current shapes:', shapes);
    setShapes((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  };

  const updateShapePosition = (id, x, y) => {
    setShapes((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, x, y } : s
      )
    );
  };

  const checkTrashCollision = (x, y) => {
    const trashX = SCREEN_WIDTH - 70;
    const trashY = 70;
    const distance = Math.sqrt(Math.pow(x - trashX, 2) + Math.pow(y - trashY, 2));
    return distance < 50;
  };

  const handleDrawingStart = (x, y) => {
    if (isDrawingMode) {
      setCurrentPath(`M ${x} ${y}`);
    }
  };

  const handleDrawingMove = (x, y) => {
    if (isDrawingMode && currentPath) {
      setCurrentPath(prev => `${prev} L ${x} ${y}`);
    }
  };

  const handleDrawingEnd = () => {
    if (isDrawingMode && currentPath) {
      setPaths(prev => [...prev, currentPath]);
      setCurrentPath('');
    }
  };

  const drawingGesture = Gesture.Pan()
    .onStart((event) => {
      runOnJS(handleDrawingStart)(event.x, event.y);
    })
    .onUpdate((event) => {
      runOnJS(handleDrawingMove)(event.x, event.y);
    })
    .onEnd(() => {
      runOnJS(handleDrawingEnd)();
    });

  const updateShapeSize = (id, width, height) => {
    setShapes((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, width, height } : s
      )
    );
  };

  const updateShapeRotation = (id, rotation) => {
    setShapes((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, rotation } : s
      )
    );
  };

  const handleShapePress = (id) => {
    setSelectedShapeId(id === selectedShapeId ? null : id);
  };

  const handleRotate = () => {
    if (selectedShapeId) {
      setShapes((prev) =>
        prev.map((shape) =>
          shape.id === selectedShapeId
            ? { ...shape, rotation: (shape.rotation || 0) + Math.PI / 4 }
            : shape
        )
      );
    }
  };

  const MenuShape = ({ shape }) => {
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);

    const gesture = Gesture.Pan()
      .onStart(() => {
        offsetX.value = 0;
        offsetY.value = 0;
      })
      .onUpdate((event) => {
        offsetX.value = event.translationX;
        offsetY.value = event.translationY;
      })
      .onEnd((event) => {
        runOnJS(handleDropShape)(event.absoluteX, event.absoluteY, shape.type);
        offsetX.value = withSpring(0);
        offsetY.value = withSpring(0);
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: offsetX.value },
        { translateY: offsetY.value },
        { rotate: '90deg' },
      ],
    }));

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.menuShapeButton, animatedStyle]}>
          <Icon name={shape.icon} size={24} color="#333" />
        </Animated.View>
      </GestureDetector>
    );
  };

  const ShapeComponent = ({ shape }) => {
    const translateX = useSharedValue(shape.x);
    const translateY = useSharedValue(shape.y);
    const width = useSharedValue(shape.width);
    const height = useSharedValue(shape.height);
    const isDragging = useSharedValue(false);
    const startWidth = useSharedValue(0);
    const startHeight = useSharedValue(0);

    const panGesture = Gesture.Pan()
      .onStart(() => {
        isDragging.value = true;
        translateX.value = shape.x;
        translateY.value = shape.y;
      })
      .onUpdate((event) => {
        if (event.numberOfPointers === 1) {
          translateX.value = shape.x + event.translationX;
          translateY.value = shape.y + event.translationY;
        }
      })
      .onEnd(() => {
        isDragging.value = false;
        const finalX = translateX.value;
        const finalY = translateY.value;
        runOnJS(updateShapePosition)(shape.id, finalX, finalY);
      });

    const pinchGesture = Gesture.Pinch()
      .onStart(() => {
        startWidth.value = width.value;
        startHeight.value = height.value;
      })
      .onUpdate((event) => {
        const newWidth = startWidth.value * event.scale;
        const newHeight = startHeight.value * event.scale;
        
        width.value = Math.max(5, Math.min(500, newWidth));
        height.value = Math.max(5, Math.min(500, newHeight));
      })
      .onEnd(() => {
        runOnJS(updateShapeSize)(shape.id, width.value, height.value);
      });

    const composed = Gesture.Simultaneous(panGesture, pinchGesture);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${shape.rotation || 0}rad` },
      ],
    }));

    const shapeData = SHAPES.find((s) => s.type === shape.type);
    const isSelected = shape.id === selectedShapeId;

    return (
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.shapeWrapper, animatedStyle]}>
          <TouchableOpacity
            onPress={() => handleShapePress(shape.id)}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.shape,
                {
                  width: width.value,
                  height: height.value,
                  backgroundColor: shape.color || shapeData?.color || '#fff',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: isSelected ? 3 : 0,
                  borderColor: '#F8A8B8',
                },
              ]}
            >
              <Icon 
                name={shapeData?.icon || 'circle'} 
                size={Math.max(8, Math.min(width.value, height.value) * 0.4)} 
                color="#333" 
              />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    );
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.canvas}>
        {shapes.map((shape) => (
          <ShapeComponent key={shape.id} shape={shape} />
        ))}
        {isDrawingMode && (
          <GestureDetector gesture={drawingGesture}>
            <View style={StyleSheet.absoluteFill}>
              <Svg style={StyleSheet.absoluteFill}>
                {paths.map((path, index) => (
                  <Path
                    key={index}
                    d={path}
                    stroke="#000"
                    strokeWidth={2}
                    fill="none"
                  />
                ))}
                {currentPath ? (
                  <Path
                    d={currentPath}
                    stroke="#000"
                    strokeWidth={2}
                    fill="none"
                  />
                ) : null}
              </Svg>
            </View>
          </GestureDetector>
        )}
      </View>

      <ScrollView style={styles.menu}>
        {SHAPES.map((shape, index) => (
          <MenuShape key={index} shape={shape} />
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-up" size={24} color="#fff" style={{ transform: [{ rotate: '90deg' }] }} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.trashCan}
        onPress={handleDeleteLastShape}
        activeOpacity={0.6}
        disabled={shapes.length === 0}
      >
        <Icon 
          name="trash" 
          size={30} 
          color="#fff" 
          style={{ transform: [{ rotate: '90deg' }] }} 
        />
      </TouchableOpacity>

      {selectedShapeId && (
        <TouchableOpacity 
          style={styles.rotateButton}
          onPress={handleRotate}
          activeOpacity={0.7}
        >
          <Icon name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'white',
  },
  canvas: {
    flex: 1,
    backgroundColor: 'white',
  },
  menu: {
    position: 'absolute',
    left: 20,
    top: 20,
    maxHeight: SCREEN_HEIGHT - 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  menuShapeButton: {
    width: 50,
    height: 50,
    marginVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  shapeWrapper: {
    position: 'absolute',
  },
  shape: {
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 10,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    bottom: 100,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8A8B8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  trashCan: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  trashCanActive: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    transform: [{ scale: 1.1 }],
  },
  pencilButton: {
    position: 'absolute',
    right: 90,
    top: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8A8B8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 1000,
  },
  pencilButtonActive: {
    backgroundColor: '#ff4444',
    transform: [{ scale: 1.1 }],
  },
  rotationHandle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8A8B8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  rotationHandleInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8A8B8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  rotateButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8A8B8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  rotateButtonActive: {
    backgroundColor: '#ff6b6b',
    transform: [{ scale: 1.1 }],
  },
});

export default Floorplan;