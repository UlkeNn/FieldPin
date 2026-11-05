import React, { useState } from "react";
import type { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { COLORS } from "@/src/lib/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PADDING = 16;

type Props = {
  labels: string[];
  /** labels ile aynı sırada, 1-1 eşleşen sayfalar */
  pages: React.ReactNode[];
};

/**
 * Kaydırmalı segmented control + yatay pager.
 *
 * Mevcut src/features/workorders/components/SegmentedSelector.tsx REUSE EDİLMEZ —
 * o ayrık bir değer seçici (aktif butonun arka planını değiştirir), kaydırma
 * pozisyonuna bağlanabilecek sürekli bir belirteci (indicator) yok.
 *
 * Proje react-native-pager-view / tab-view KULLANMIYOR — mevcut
 * react-native-reanimated (zaten create.tsx'te kurulu) ile, yeni bağımlılık
 * eklemeden yazıldı. Belirteç scrollX shared value'suna bağlı, kaydırmayla
 * BİREBİR (sürekli) kayar; başlığa tıklama ilgili sayfaya animasyonlu kayarak
 * geçer. Aktif başlık rengi ayrık bir state (index) ile güncellenir.
 *
 * Yatay ScrollView içinde dikey FlatList'ler var (her sayfa) — RN'in "nested
 * VirtualizedList" uyarısı yalnızca AYNI yönlü iç içe listelerde çıkar, bu
 * kombinasyon sorunsuz.
 *
 * NOT: app.json'da orientation "portrait" sabit — SCREEN_WIDTH modül
 * yüklenirken bir kez okunuyor, rotasyon senaryosu bu uygulamada yok.
 */
export function SegmentedPager({ labels, pages }: Props) {
  const n = labels.length;
  const pageWidth = SCREEN_WIDTH;
  const trackWidth = pageWidth - PADDING * 2;

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (scrollX.value / (n * pageWidth)) * trackWidth }],
  }));

  function goTo(index: number) {
    setActiveIndex(index);
    // useAnimatedRef'in .current'ı JS thread'de normal bir native component
    // instance'ı gibi davranır — burada worklet içinde değiliz, düz bir onPress.
    (scrollRef.current as any)?.scrollTo({ x: index * pageWidth, animated: true });
  }

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setActiveIndex(idx);
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Başlıklar + belirteç */}
      <View style={{ paddingHorizontal: PADDING, paddingTop: 4 }}>
        <View style={{ flexDirection: "row" }}>
          {labels.map((label, i) => (
            <TouchableOpacity
              key={label}
              onPress={() => goTo(i)}
              activeOpacity={0.7}
              style={{ flex: 1, paddingVertical: 10, alignItems: "center" }}
            >
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 15,
                  color: activeIndex === i ? COLORS.primary : "#667085",
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={{
            height: 3,
            backgroundColor: COLORS.border,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={[
              {
                width: `${100 / n}%`,
                height: "100%",
                backgroundColor: COLORS.primary,
                borderRadius: 2,
              },
              indicatorStyle,
            ]}
          />
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        style={{ flex: 1 }}
      >
        {pages.map((page, i) => (
          <View key={i} style={{ width: pageWidth, flex: 1 }}>
            {page}
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}
