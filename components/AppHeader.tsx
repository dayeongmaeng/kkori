import { Image } from "expo-image";
import { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/theme";
import { useCurrentPet } from "../contexts/PetContext";

const FEEDBACK_URL = "https://open.kakao.com/o/sqYtAKvi";

const logoSource = require("../assets/logo.png");

function Logo() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <Text style={styles.logoText}>꼬리</Text>;
  }
  return (
    <Image
      source={logoSource}
      style={styles.logoImage}
      contentFit="contain"
      onError={() => setFailed(true)}
    />
  );
}

export default function AppHeader() {
  const insets = useSafeAreaInsets();
  const { currentPet } = useCurrentPet();
  const petName = currentPet?.name ?? null;

  function handlePetPress() {
    Alert.alert("알림", "반려동물 추가 기능은 출시 예정이에요 🐾");
  }

  function handleBetaPress() {
    if (Platform.OS === "web") {
      if (
        window.confirm(
          "꼬리는 한창 만들어지고 있어요.\n여러분의 의견이 큰 도움이 돼요.\n\n카카오톡 오픈채팅으로 연결할까요?",
        )
      ) {
        window.location.href = FEEDBACK_URL;
      }
    } else {
      Alert.alert(
        "베타 테스트 중이에요 🐾",
        "꼬리는 한창 만들어지고 있어요.\n여러분의 의견이 큰 도움이 돼요.\n\n카카오톡 오픈채팅으로 연결할까요?",
        [
          { text: "취소", style: "cancel" },
          { text: "의견 보내기", onPress: () => Linking.openURL(FEEDBACK_URL) },
        ],
      );
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* 좌측: 현재 펫 이름 + 드롭다운 화살표 */}
      <TouchableOpacity
        style={styles.petButton}
        onPress={handlePetPress}
        activeOpacity={0.7}
      >
        <Text style={styles.petName} numberOfLines={1}>
          {petName ?? "반려동물 등록"}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <View style={styles.center} />

      {/* 우측: BETA 배지 + 로고 */}
      <View style={styles.logoArea}>
        <TouchableOpacity
          style={styles.betaBadge}
          onPress={handleBetaPress}
          activeOpacity={0.7}
        >
          <Text style={styles.betaText}>BETA ›</Text>
        </TouchableOpacity>
        <Logo />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    paddingLeft: 16,
    paddingRight: 10,
  },
  petButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 160,
  },
  petName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  arrow: {
    fontSize: 9,
    color: colors.textTertiary,
    marginTop: 1,
  },
  center: {
    flex: 1,
  },
  logoArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  betaBadge: {
    backgroundColor: "#FFE4D1",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  betaText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E8985C",
    letterSpacing: 0.5,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
});
