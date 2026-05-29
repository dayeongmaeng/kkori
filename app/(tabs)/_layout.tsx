import { Tabs } from 'expo-router';
import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Home, NotebookPen, PawPrint, Settings } from 'lucide-react-native';
import AppHeader from '../../components/AppHeader';
import { colors } from '../../constants/theme';
import { useCurrentPet } from '../../contexts/PetContext';

let tabIcons: Record<string, any> | null = null;
try {
  tabIcons = {
    home: require('../../assets/tabs/home.svg'),
    photo: require('../../assets/tabs/photo.svg'),
    log: require('../../assets/tabs/records.svg'),
    'dog-profile': require('../../assets/tabs/dog-profile.svg'),
    'cat-profile': require('../../assets/tabs/cat-profile.svg'),
    settings: require('../../assets/tabs/settings.svg'),
  };
} catch {
  tabIcons = null;
}

function TabIcon({
  name,
  focused,
  fallback,
}: {
  name: keyof NonNullable<typeof tabIcons>;
  focused: boolean;
  fallback: React.ReactNode;
}) {
  const tintColor = focused ? colors.primary : colors.textTertiary;
  if (tabIcons) {
    return (
      <Image
        source={tabIcons[name]}
        style={{ width: 24, height: 24 }}
        tintColor={tintColor}
        resizeMode="contain"
      />
    );
  }
  return <>{fallback}</>;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { currentPet } = useCurrentPet();
  const profileIconName = currentPet?.species?.toLowerCase() === 'cat' ? 'cat-profile' : 'dog-profile';

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
            paddingTop: 0,
            paddingBottom: insets.bottom,
            height: 56 + insets.bottom,
          },
          tabBarItemStyle: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0,
            margin: 0,
          },
          tabBarIconStyle: {
            width: 40,
            height: 40,
            margin: 0,
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="home" focused={focused} fallback={<Home size={24} color={color} />} />
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: '기록',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="log" focused={focused} fallback={<NotebookPen size={24} color={color} />} />
            ),
          }}
        />
        <Tabs.Screen
          name="photo"
          options={{
            title: '포토',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="photo" focused={focused} fallback={<Camera size={24} color={color} />} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '프로필',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name={profileIconName} focused={focused} fallback={<PawPrint size={24} color={color} />} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '설정',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon name="settings" focused={focused} fallback={<Settings size={24} color={color} />} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
