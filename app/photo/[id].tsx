import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PhotoActionSheet from "../../components/PhotoActionSheet";
import { colors, spacing } from "../../constants/theme";
import { showConfirm } from "../../lib/dialog";
import { WEB_BASE_URL } from "../../lib/api/client";
import { photoApi } from "../../lib/api/photo";
import { getCachedCurrentPetId } from "../../lib/cache/pet";
import {
  getCachedPhotos,
  LocalPhoto,
  mergeWithLocal,
  removeCachedPhoto,
  setCachedPhotos,
  upsertCachedPhoto,
} from "../../lib/cache/photo";
import { deletePhotoLocal } from "../../lib/photoLocalCache";
import { base64ToTempFile } from "../../lib/photoUtils";

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_CAPTION = 100;
const FEED_CAPTION_HEIGHT = 108;
const FEED_SEPARATOR_HEIGHT = 8;
const FEED_CARD_HEIGHT = SCREEN_WIDTH + FEED_CAPTION_HEIGHT;

function formatDateKorean(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

function getTodayKST(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function buildPhotoShareUrl(externalId: string) {
  return `${WEB_BASE_URL.replace(/\/$/, "")}/photos/${encodeURIComponent(externalId)}`;
}

export default function PhotoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [initialIndex, setInitialIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [actionPhoto, setActionPhoto] = useState<LocalPhoto | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [sharePreviewVisible, setSharePreviewVisible] = useState(false);
  const [captionModalVisible, setCaptionModalVisible] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const flatListRef = useRef<FlatList<LocalPhoto>>(null);
  const captionInputRef = useRef<TextInput>(null);

  useEffect(() => {
    async function load() {
      const petId = await getCachedCurrentPetId();
      if (!petId) {
        setLoaded(true);
        return;
      }

      // 캐시에서 즉시 로드
      const cached = await getCachedPhotos(petId);
      const merged = await mergeWithLocal(cached);
      const idx = Math.max(
        0,
        merged.findIndex((p) => p.externalId === id),
      );
      setPhotos(merged);
      setInitialIndex(idx);
      setLoaded(true);

      // 백그라운드 서버 갱신
      try {
        const serverPhotos = await photoApi.getPhotos(petId);
        await setCachedPhotos(petId, serverPhotos);
        const serverMerged = await mergeWithLocal(serverPhotos);
        setPhotos(serverMerged);
      } catch {
        // 오프라인 — 캐시 유지
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!captionModalVisible) return;

    const timer = setTimeout(() => {
      captionInputRef.current?.focus();
    }, 250);

    return () => clearTimeout(timer);
  }, [captionModalVisible]);

  function openSharePreview() {
    setActionSheetVisible(false);
    if (!actionPhoto) return;
    setSharePreviewVisible(true);
  }

  async function sharePhotoLink() {
    if (!actionPhoto) return;
    const url = buildPhotoShareUrl(actionPhoto.externalId);
    try {
      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({ title: "꼬리 사진", url });
        } else {
          await Linking.openURL(url);
        }
        return;
      }
      await Share.share({
        title: "꼬리 사진",
        message: url,
        url,
      });
    } catch {
      Alert.alert("오류", "공유 링크를 만들지 못했어요.");
    }
  }

  async function openShareUrl() {
    if (!actionPhoto) return;
    const url = buildPhotoShareUrl(actionPhoto.externalId);
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "링크를 열 수 없어요",
        "공유 웹 도메인이 아직 연결되지 않았을 수 있어요. Vercel 도메인 연결 후 다시 확인해주세요.",
      );
    }
  }

  function openCaptionEditor() {
    setActionSheetVisible(false);
    if (!actionPhoto) return;
    setEditingPhotoId(actionPhoto.externalId);
    setCaptionDraft(actionPhoto.caption ?? "");
    setCaptionModalVisible(true);
  }

  async function handleSaveCaption() {
    const targetPhoto =
      photos.find((photo) => photo.externalId === editingPhotoId) ??
      actionPhoto;
    if (!targetPhoto || isSavingCaption) return;
    const petId = await getCachedCurrentPetId();
    if (!petId) return;

    setIsSavingCaption(true);
    try {
      Keyboard.dismiss();
      const updated = await photoApi.updatePhoto(targetPhoto.externalId, {
        caption: captionDraft.trim() || undefined,
      });
      await upsertCachedPhoto(petId, updated);
      const merged = await mergeWithLocal(await getCachedPhotos(petId));
      setPhotos(merged);
      setCaptionModalVisible(false);
      setEditingPhotoId(null);
    } catch {
      Alert.alert(
        "저장 실패",
        "오늘의 한 줄 기록을 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setIsSavingCaption(false);
    }
  }

  async function handleSaveToAlbum() {
    setActionSheetVisible(false);
    if (!actionPhoto) return;
    if (!actionPhoto.photoUri) {
      Alert.alert("알림", "이 사진은 다른 기기에서 촬영되어 저장할 수 없어요.");
      return;
    }
    try {
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = actionPhoto.photoUri;
        link.download = `photo_${actionPhoto.date}.jpg`;
        link.click();
        return;
      }
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "권한 필요",
          "사진을 저장하려면 사진첩 접근 권한이 필요해요.",
        );
        return;
      }
      const tempUri = await base64ToTempFile(
        actionPhoto.photoUri,
        `photo_${actionPhoto.externalId}.jpg`,
      );
      await MediaLibrary.saveToLibraryAsync(tempUri);
      Alert.alert("완료", "사진첩에 저장됐어요 🐾");
    } catch {
      Alert.alert("오류", "저장 중 문제가 발생했어요.");
    }
  }

  async function doDelete() {
    if (!actionPhoto) return;
    const petId = await getCachedCurrentPetId();
    if (!petId) return;
    try {
      await photoApi.deletePhoto(actionPhoto.externalId);
      await deletePhotoLocal(actionPhoto.externalId);
      await removeCachedPhoto(petId, actionPhoto.externalId);
      router.back();
    } catch {
      Alert.alert("오류", "삭제에 실패했어요. 다시 시도해주세요.");
    }
  }

  function handleDelete() {
    setActionSheetVisible(false);
    if (!actionPhoto) return;

    const isToday = actionPhoto.date === getTodayKST();
    const message = isToday
      ? "오늘 사진을 삭제할까요?\n같은 날 다시 추가할 수 있어요."
      : "이 사진을 삭제할까요?\n해당 날짜에는 다시 추가할 수 없어요.";

    showConfirm("사진 삭제", message, doDelete, {
      confirmText: "삭제",
      confirmStyle: "destructive",
    });
  }

  if (!loaded) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (photos.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.notFoundEmoji}>🔍</Text>
        <Text style={styles.notFoundText}>사진을 찾을 수 없어요</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBtnText}>뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerDate}>하루 한 장</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.listContainer}>
        {loaded && (
          <FlatList
            ref={flatListRef}
            data={photos}
            keyExtractor={(item) => item.externalId}
            showsVerticalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({
              length: FEED_CARD_HEIGHT,
              offset: index * (FEED_CARD_HEIGHT + FEED_SEPARATOR_HEIGHT),
              index,
            })}
            onScrollToIndexFailed={(info) => {
              flatListRef.current?.scrollToOffset({
                offset: info.index * (FEED_CARD_HEIGHT + FEED_SEPARATOR_HEIGHT),
                animated: false,
              });
            }}
            ItemSeparatorComponent={() => (
              <View style={{ height: FEED_SEPARATOR_HEIGHT, backgroundColor: colors.background }} />
            )}
            renderItem={({ item }) => (
              <View style={styles.feedCard}>
                {item.photoUri || item.mediumUrl ? (
                  <Image
                    source={{ uri: item.photoUri ?? item.mediumUrl }}
                    style={styles.feedPhoto}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.feedPhoto, styles.noLocalPhoto]}>
                    <Text style={styles.noLocalEmoji}>📲</Text>
                    <Text style={styles.noLocalText}>
                      다른 기기에서 찍은 사진이에요
                    </Text>
                  </View>
                )}
                <View style={styles.feedCaptionSection}>
                  <View style={styles.feedCaptionRow}>
                    <Text style={styles.feedDateText}>{formatDateKorean(item.date)}</Text>
                    <TouchableOpacity
                      style={styles.cardMenuBtn}
                      onPress={() => {
                        setActionPhoto(item);
                        setActionSheetVisible(true);
                      }}
                      activeOpacity={0.75}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.cardMenuBtnText}>•••</Text>
                    </TouchableOpacity>
                  </View>
                  {item.caption ? (
                    <Text style={styles.feedCaptionText} numberOfLines={3}>{item.caption}</Text>
                  ) : (
                    <Text style={styles.feedCaptionEmpty}>오늘의 한 줄 기록이 없어요</Text>
                  )}
                </View>
              </View>
            )}
          />
        )}
      </View>

      <PhotoActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        onShare={openSharePreview}
        onEditCaption={openCaptionEditor}
        onSaveToAlbum={handleSaveToAlbum}
        onDelete={handleDelete}
      />

      <Modal
        visible={sharePreviewVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSharePreviewVisible(false)}
      >
        <View style={styles.shareBackdrop}>
          <View style={styles.shareSheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.shareScrollContent}
            >
              <View style={styles.shareHeader}>
                <View>
                  <Text style={styles.shareEyebrow}>공유 미리보기</Text>
                  <Text style={styles.shareTitle}>하루 한 장</Text>
                </View>
                <TouchableOpacity
                  style={styles.shareCloseBtn}
                  onPress={() => setSharePreviewVisible(false)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.shareCloseText}>닫기</Text>
                </TouchableOpacity>
              </View>

              {actionPhoto && (
                <>
                  {actionPhoto.mediumUrl || actionPhoto.photoUri ? (
                    <Image
                      source={{
                        uri: actionPhoto.mediumUrl ?? actionPhoto.photoUri,
                      }}
                      style={styles.sharePhoto}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.sharePhoto, styles.sharePhotoEmpty]}>
                      <Text style={styles.sharePhotoEmptyText}>
                        사진을 불러올 수 없어요
                      </Text>
                    </View>
                  )}
                  <View style={styles.shareContent}>
                    <Text style={styles.shareDate}>
                      {formatDateKorean(actionPhoto.date)}
                    </Text>
                    {actionPhoto.caption ? (
                      <Text style={styles.shareCaption}>
                        {actionPhoto.caption}
                      </Text>
                    ) : (
                      <Text style={styles.shareEmptyCaption}>
                        오늘의 한 줄 기록이 없는 사진이에요.
                      </Text>
                    )}
                    {/* <Text style={styles.shareUrl} numberOfLines={1}>
                    {buildPhotoShareUrl(actionPhoto.externalId)}
                  </Text> */}
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.sharePrimaryBtn}
                onPress={sharePhotoLink}
                activeOpacity={0.82}
              >
                <Text style={styles.sharePrimaryText}>공유하기</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity style={styles.shareSecondaryBtn} onPress={openShareUrl} activeOpacity={0.82}>
              <Text style={styles.shareSecondaryText}>브라우저에서 보기</Text>
            </TouchableOpacity> */}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={captionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setCaptionModalVisible(false);
          setEditingPhotoId(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
            style={styles.modalKeyboardView}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={styles.captionScrollContent}
            >
              <View style={styles.captionSheet}>
                <Text style={styles.captionSheetTitle}>오늘의 한 줄 기록 수정</Text>
                <TextInput
                  ref={captionInputRef}
                  style={styles.captionInput}
                  value={captionDraft}
                  onChangeText={(text) =>
                    setCaptionDraft(text.slice(0, MAX_CAPTION))
                  }
                  placeholder="오늘 어떤 하루였나요?"
                  placeholderTextColor={colors.textQuaternary}
                  multiline
                  autoFocus
                  keyboardType="default"
                  returnKeyType="done"
                  blurOnSubmit
                  textAlignVertical="top"
                />
                <Text style={styles.captionCounter}>
                  {captionDraft.length}/{MAX_CAPTION}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.captionSaveBtn,
                    isSavingCaption && styles.captionSaveBtnDisabled,
                  ]}
                  onPress={handleSaveCaption}
                  disabled={isSavingCaption}
                  activeOpacity={0.82}
                >
                  <Text style={styles.captionSaveBtnText}>
                    {isSavingCaption ? "저장 중..." : "저장"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.captionCancelBtn}
                  onPress={() => {
                    Keyboard.dismiss();
                    setCaptionModalVisible(false);
                    setEditingPhotoId(null);
                  }}
                  disabled={isSavingCaption}
                >
                  <Text style={styles.captionCancelBtnText}>취소</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  headerDate: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  listContainer: {
    flex: 1,
  },
  feedCard: {
    width: SCREEN_WIDTH,
    backgroundColor: colors.surface,
  },
  feedPhoto: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  feedCaptionSection: {
    height: FEED_CAPTION_HEIGHT,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  feedCaptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  feedDateText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  feedCaptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  feedCaptionEmpty: {
    fontSize: 14,
    color: colors.textTertiary,
    fontStyle: "italic",
  },
  noLocalPhoto: {
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  noLocalEmoji: {
    fontSize: 48,
  },
  noLocalText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: "center",
  },
  captionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  editedBadge: {
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  editedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textTertiary,
  },
  cardMenuBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  cardMenuBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  notFoundEmoji: {
    fontSize: 48,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  backButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  backButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  captionScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  captionSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.lg,
    gap: spacing.md,
  },
  captionSheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  captionInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  captionCounter: {
    alignSelf: "flex-end",
    marginTop: -spacing.xs,
    fontSize: 12,
    color: colors.textQuaternary,
  },
  captionSaveBtn: {
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  captionSaveBtnDisabled: {
    opacity: 0.5,
  },
  captionSaveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textOnPrimary,
  },
  captionCancelBtn: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  captionCancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  shareBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  shareSheet: {
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.lg,
  },
  shareScrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  shareHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shareEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textTertiary,
  },
  shareTitle: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  shareCloseBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  shareCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  sharePhoto: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
  },
  sharePhotoEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },
  sharePhotoEmptyText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  shareContent: {
    gap: spacing.sm,
  },
  shareDate: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textTertiary,
  },
  shareCaption: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  shareEmptyCaption: {
    fontSize: 15,
    color: colors.textTertiary,
    fontStyle: "italic",
  },
  shareUrl: {
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 12,
    color: colors.textTertiary,
  },
  sharePrimaryBtn: {
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  sharePrimaryText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textOnPrimary,
  },
  shareSecondaryBtn: {
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  shareSecondaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
