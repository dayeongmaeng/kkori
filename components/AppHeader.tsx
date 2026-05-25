import { Image } from "expo-image";
import { router, useGlobalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../constants/theme";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pets, setPets] = useState<PetResponse[]>([]);

  async function handlePetPress() {
    const cached = await getCachedPets();
    setPets(cached);
    setSheetOpen(true);
  }

  function handleSelectPet(pet: PetResponse) {
    setCurrentPet(pet);
    setCachedCurrentPetId(pet.externalId);
    setSheetOpen(false);
  }

  function handleAddPet() {
    setSheetOpen(false);
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
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {/* 좌측: 현재 펫 이름 + 화살표 */}
      <TouchableOpacity
        style={styles.petButton}
        onPress={handlePetPress}
        activeOpacity={0.7}
      >
        <Text style={styles.petName} numberOfLines={1}>
          {isCreateMode ? "반려동물 추가" : (currentPet?.name ?? "반려동물 등록")}
        </Text>
        <Text style={styles.arrow}>{sheetOpen ? "▲" : "▼"}</Text>
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

      {/* 반려동물 선택 바텀시트 */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSheetOpen(false)}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
                {/* 핸들 바 */}
                <View style={styles.handle} />

                {/* 시트 헤더 */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>반려동물 선택</Text>
                  <TouchableOpacity onPress={() => setSheetOpen(false)} activeOpacity={0.7} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* 반려동물 목록 */}
                <ScrollView
                  style={styles.petList}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {pets.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>등록된 반려동물이 없어요</Text>
                      <Text style={styles.emptySubText}>아래 버튼으로 추가해보세요</Text>
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
                            style={[styles.petItemText, isSelected && styles.petItemTextSelected]}
                            numberOfLines={1}
                          >
                            {pet.name}
                          </Text>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>

                {/* 구분선 */}
                <View style={styles.divider} />

                {/* 반려동물 추가 CTA */}
                <TouchableOpacity
                  style={styles.addPetButton}
                  onPress={handleAddPet}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addPetButtonText}>+ 반려동물 추가</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const SHEET_MAX_HEIGHT = Dimensions.get("window").height * 0.65;

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
  // 바텀시트
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: SHEET_MAX_HEIGHT,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  petList: {
    flexGrow: 0,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  emptySubText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  petItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  petItemSelected: {
    backgroundColor: colors.surfaceAlt,
  },
  petItemText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  petItemTextSelected: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  checkmark: {
    fontSize: 14,
    color: colors.success,
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  addPetButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  addPetButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
