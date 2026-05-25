import { Image } from "expo-image";
import { router, useGlobalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow, spacing } from "../constants/theme";
import { useCurrentPet } from "../contexts/PetContext";
import { PetResponse } from "../lib/api/pet";
import { getCachedPets, setCachedCurrentPetId } from "../lib/cache/pet";

const FEEDBACK_URL = "https://open.kakao.com/o/sqYtAKvi";
const logoSource = require("../assets/logo.png");

function Logo() {
  const [failed, setFailed] = useState(false);
  if (failed) return <Text style={styles.logoText}>꼬리</Text>;
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
  const { currentPet, setCurrentPet } = useCurrentPet();
  const { mode } = useGlobalSearchParams<{ mode?: string }>();
  const isCreateMode = mode === "create";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [headerHeight, setHeaderHeight] = useState(0);

  async function handlePetPress() {
    const cached = await getCachedPets();
    setPets(cached);
    setDropdownOpen(true);
  }

  function handleSelectPet(pet: PetResponse) {
    setCurrentPet(pet);
    setCachedCurrentPetId(pet.externalId);
    setDropdownOpen(false);
  }

  function handleAddPet() {
    setDropdownOpen(false);
    router.navigate({ pathname: "/(tabs)/profile", params: { mode: "create" } } as any);
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
    <View
      style={[styles.container, { paddingTop: insets.top + 10 }]}
      onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
    >
      {/* 좌측: 현재 펫 이름 + 드롭다운 화살표 */}
      <TouchableOpacity
        style={styles.petButton}
        onPress={handlePetPress}
        activeOpacity={0.7}
      >
        <Text style={styles.petName} numberOfLines={1}>
          {isCreateMode ? "반려동물 추가" : (currentPet?.name ?? "반려동물 등록")}
        </Text>
        <Text style={styles.arrow}>{dropdownOpen ? "▲" : "▼"}</Text>
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

      {/* 반려동물 선택 드롭다운 */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownOpen(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.dropdown, { top: headerHeight }]}>
                {pets.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>등록된 반려동물이 없어요</Text>
                  </View>
                ) : (
                  pets.map((pet) => {
                    const isSelected = !isCreateMode && currentPet?.externalId === pet.externalId;
                    return (
                      <TouchableOpacity
                        key={pet.externalId}
                        style={[styles.petItem, isSelected && styles.petItemSelected]}
                        onPress={() => handleSelectPet(pet)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.petItemText,
                            isSelected && styles.petItemTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {pet.name}
                        </Text>
                        {isSelected && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
                <View style={styles.dropdownDivider} />
                <TouchableOpacity
                  style={[styles.addPetRow, isCreateMode && styles.petItemSelected]}
                  onPress={handleAddPet}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addPetText}>+ 반려동물 추가</Text>
                  {isCreateMode ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  // 드롭다운
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  dropdown: {
    position: "absolute",
    left: 12,
    width: 150,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
    overflow: "hidden",
  },
  emptyState: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  petItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  petItemSelected: {
    backgroundColor: colors.surfaceAlt,
  },
  petItemText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  petItemTextSelected: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  checkmark: {
    fontSize: 13,
    color: colors.success,
    marginLeft: 8,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  addPetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  addPetText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
});
