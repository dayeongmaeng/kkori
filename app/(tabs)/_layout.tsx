import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import { HomeIcon, PawOutlineIcon, PhotoIcon, RecordsIcon, SettingsIcon } from '../../components/TabIcons';
import { colors, typography } from '../../constants/theme';
export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <Tabs
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 6,
            paddingBottom: insets.bottom + 6,
            height: 66 + insets.bottom,
          },
          tabBarItemStyle: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0,
            margin: 0,
          },
          tabBarIconStyle: {
            width: 24,
            height: 24,
            margin: 0,
          },
          tabBarLabelStyle: {
            fontSize: typography.caption2.fontSize,
            lineHeight: typography.caption2.lineHeight,
            marginTop: 1,
            includeFontPadding: false,
          },
          tabBarShowLabel: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: '기록',
            tabBarIcon: ({ color }) => <RecordsIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="photo"
          options={{
            title: '하루한장',
            tabBarIcon: ({ color }) => <PhotoIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '프로필',
            tabBarIcon: ({ color }) => <PawOutlineIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '설정',
            tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
