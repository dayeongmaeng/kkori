import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Modal, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

LocaleConfig.locales['ko'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

interface MarkedDate {
  marked?: boolean;
  dotColor?: string;
}

interface Props {
  visible: boolean;
  selectedDate: string;
  markedDates: Record<string, MarkedDate>;
  onSelect: (date: string) => void;
  onClose: () => void;
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function DatePickerModal({
  visible,
  selectedDate,
  markedDates,
  onSelect,
  onClose,
}: Props) {
  const merged: Record<string, object> = {
    ...markedDates,
    [selectedDate]: {
      ...(markedDates[selectedDate] ?? {}),
      selected: true,
      selectedColor: colors.primary,
    },
  };

  function handleDayPress(day: DateData) {
    onSelect(day.dateString);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Calendar
          current={selectedDate}
          maxDate={getTodayString()}
          markedDates={merged}
          onDayPress={handleDayPress}
          theme={{
            calendarBackground: colors.surface,
            monthTextColor: colors.textPrimary,
            textMonthFontWeight: '700',
            textMonthFontSize: 16,
            dayTextColor: colors.textPrimary,
            textDayFontSize: 14,
            textDayFontWeight: '500',
            todayTextColor: colors.accent,
            todayFontWeight: '700',
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.textOnPrimary,
            dotColor: colors.accent,
            selectedDotColor: colors.textOnPrimary,
            arrowColor: colors.primary,
            textDisabledColor: colors.textQuaternary,
            textSectionTitleColor: colors.textTertiary,
          }}
          style={styles.calendar}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  calendar: {
    borderRadius: radius.md,
  },
});
