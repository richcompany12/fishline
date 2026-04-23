import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share, SafeAreaView,
} from 'react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  getAllHistory, deleteHistory, HistoryRecord, formatDate,
} from '@/lib/historyService';

export default function HistoryScreen() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);

  const loadHistory = useCallback(async () => {
    const data = await getAllHistory();
    setRecords(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleDelete = (id: string, memo: string) => {
    Alert.alert(
      '삭제',
      `"${memo || '이 기록'}"을 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await deleteHistory(id);
            loadHistory();
          },
        },
      ]
    );
  };

  const handleShareRecord = async (record: HistoryRecord) => {
    const itemsText = record.items.map(i => `${i.name}: ${i.count}마리`).join('\n');
    const message = `🎣 FISHLINE 조과 기록 🎣

📅 ${formatDate(record.date)}
📝 ${record.memo}

${itemsText}

🏆 총 ${record.totalCount}마리

▶ FISHLINE 앱으로 만든 기록:
https://play.google.com/store/apps/details?id=com.richcompany.fishlineapp`;

    try {
      await Share.share({ message });
    } catch (e) {
      console.log('공유 오류:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.logo}>FISHLINE</Text>
          <Text style={styles.logoSub}>HISTORY</Text>
        </View>
      </View>

      {/* 기록 리스트 */}
      {records.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>저장된 기록이 없어요</Text>
          <Text style={styles.emptyDesc}>
            카운터 화면에서 조과를 저장하면{'\n'}
            여기에 쌓여요
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.countSummary}>
            총 <Text style={styles.countHighlight}>{records.length}</Text>개의 기록
          </Text>

          {records.map(record => (
            <View key={record.id} style={styles.card}>
              {/* 날짜 + 총 마리수 */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>📅 {formatDate(record.date)}</Text>
                <Text style={styles.cardTotal}>총 {record.totalCount}마리</Text>
              </View>

              {/* 메모 */}
              <Text style={styles.cardMemo}>{record.memo || '(메모 없음)'}</Text>

              {/* 항목별 카운트 */}
              <View style={styles.itemsWrap}>
                {record.items.map((item, idx) => (
                  <View key={idx} style={styles.itemChip}>
                    <Text style={styles.itemChipName}>{item.name}</Text>
                    <Text style={styles.itemChipCount}>{item.count}</Text>
                  </View>
                ))}
              </View>

              {/* 액션 버튼 */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleShareRecord(record)}
                >
                  <Text style={styles.actionBtnText}>🔗 공유</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(record.id, record.memo)}
                >
                  <Text style={[styles.actionBtnText, styles.deleteBtnText]}>🗑️ 삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.15)',
  },
  backBtn: {
    marginRight: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 24,
    color: '#c9a84c',
    fontWeight: '300',
  },
  logo: { fontSize: 22, fontWeight: '700', letterSpacing: 4, color: '#e8c96a' },
  logoSub: { fontSize: 8, letterSpacing: 4, color: '#8a7a5a', marginTop: 2 },

  // 빈 상태
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 15,
    color: '#8a7a5a',
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#3a3020',
    textAlign: 'center',
    lineHeight: 20,
  },

  countSummary: {
    fontSize: 11,
    color: '#8a7a5a',
    marginBottom: 12,
    letterSpacing: 1,
  },
  countHighlight: {
    color: '#c9a84c',
    fontWeight: '700',
    fontSize: 13,
  },

  // 카드
  card: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.08)',
  },
  cardDate: {
    fontSize: 11,
    color: '#8a7a5a',
    letterSpacing: 0.5,
  },
  cardTotal: {
    fontSize: 13,
    color: '#c9a84c',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardMemo: {
    fontSize: 14,
    color: '#f0ead8',
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 20,
  },

  // 항목 칩
  itemsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  itemChipName: {
    fontSize: 12,
    color: '#f0ead8',
  },
  itemChipCount: {
    fontSize: 12,
    color: '#c9a84c',
    fontWeight: '700',
  },

  // 액션 버튼
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    color: '#c9a84c',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    borderColor: 'rgba(224,85,85,0.3)',
  },
  deleteBtnText: {
    color: '#e05555',
  },
});