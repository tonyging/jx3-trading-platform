import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { transactionApi } from '@/services/api/transaction';
import { useUserStore } from '@/stores/user';
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const transaction = ref(null);
const newMessage = ref('');
const loading = ref(true);
const error = ref(null);
const permissionDenied = ref(false); // 新增權限被拒絕的狀態
// 載入交易詳情
const loadTransactionDetails = async () => {
    try {
        loading.value = true;
        error.value = null;
        permissionDenied.value = false;
        const response = await transactionApi.getTransactionDetails(route.params.id);
        transaction.value = response.data;
    }
    catch (err) {
        console.error('載入交易詳情錯誤:', err);
        const errorMessage = String(err);
        // 檢查是否為權限錯誤
        if (errorMessage.includes('權限') || errorMessage.includes('沒有權限')) {
            permissionDenied.value = true;
            error.value = errorMessage;
        }
        else {
            error.value = errorMessage;
        }
    }
    finally {
        loading.value = false;
    }
};
// 發送訊息
const sendMessage = async () => {
    if (!newMessage.value.trim())
        return;
    try {
        await transactionApi.sendMessage(route.params.id, newMessage.value);
        newMessage.value = '';
        await loadTransactionDetails(); // 重新載入交易詳情以更新訊息
    }
    catch (err) {
        error.value = err instanceof Error ? err.message : '發送訊息失敗';
    }
};
// 格式化時間
const formatTime = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};
// 格式化金額
const formatPrice = (price) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: getCurrencyCode(transaction.value?.currency || '台幣'),
        minimumFractionDigits: 0,
    }).format(price);
};
// 幣種轉換為貨幣代碼
const getCurrencyCode = (currency) => {
    switch (currency) {
        case '台幣':
            return 'TWD';
        case '人民幣':
            return 'CNY';
        case '港幣':
            return 'HKD';
        default:
            return 'TWD';
    }
};
onMounted(() => {
    loadTransactionDetails();
});
const goBackToTradingTab = () => {
    router.push('/');
    localStorage.setItem('defaultTab', 'trading');
};
// 檢查是否可以結束交易的計算屬性
const canCompleteTransaction = computed(() => {
    if (!transaction.value)
        return false;
    // 只有買家和賣家可以操作
    const isParticipant = transaction.value.seller._id === userStore.currentUser?.id ||
        transaction.value.buyer._id === userStore.currentUser?.id;
    // 只有在特定狀態可以結束
    const isValidStatus = ['reserved', 'pending_payment'].includes(transaction.value.status);
    // 如果是買家且已確認，則不可點擊
    if (userRole.value === 'buyer' && transaction.value.buyerConfirmed) {
        return false;
    }
    // 如果是賣家且已確認，則不可點擊
    if (userRole.value === 'seller' && transaction.value.sellerConfirmed) {
        return false;
    }
    return isParticipant && isValidStatus;
});
// 新增通知方法
const notification = ref({
    show: false,
    message: '',
    type: 'success',
});
// 顯示通知的方法
const showNotification = (message, type = 'success') => {
    notification.value = {
        show: true,
        message,
        type,
    };
    // 3秒後自動關閉通知
    setTimeout(() => {
        notification.value.show = false;
    }, 3000);
};
// 完成交易的方法
const completeTransaction = async () => {
    try {
        if (!canCompleteTransaction.value) {
            showNotification('您沒有權限完成此交易', 'error');
            return;
        }
        // 彈出確認對話框
        const confirmed = confirm('確定要結束這筆交易嗎？');
        if (!confirmed)
            return;
        console.log('Attempting to complete transaction:', route.params.id);
        const response = await transactionApi.completeTransaction(route.params.id);
        console.log('Complete transaction response:', response);
        // 顯示成功訊息
        showNotification('交易已成功結束', 'success');
        // 重新載入交易詳情以更新狀態
        await loadTransactionDetails();
    }
    catch (error) {
        // 處理可能的錯誤
        showNotification(error instanceof Error ? error.message : '結束交易失敗', 'error');
    }
};
const formatStatus = (status) => {
    const statusMap = {
        reserved: '交易中',
        pending_payment: '等待付款',
        payment_confirmed: '付款確認',
        completed: '已完成',
        cancelled: '已取消',
    };
    return statusMap[status] || status;
};
// 判斷當前用戶是買家還是賣家
const userRole = computed(() => {
    if (!transaction.value || !userStore.currentUser)
        return null;
    if (transaction.value.seller._id === userStore.currentUser.id) {
        return 'seller';
    }
    else if (transaction.value.buyer._id === userStore.currentUser.id) {
        return 'buyer';
    }
    return null;
});
// 監聽 transaction 的變化
watch(() => transaction.value, (newTransaction) => {
    if (newTransaction) {
        console.log('=== Transaction Details ===');
        console.log('Transaction ID:', newTransaction._id);
        console.log('Status:', newTransaction.status);
        console.log('Seller Confirmed:', newTransaction.sellerConfirmed);
        console.log('Buyer Confirmed:', newTransaction.buyerConfirmed);
        console.log('Full Transaction Object:', newTransaction);
        console.log('========================');
    }
}); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['status-item', 'label', 'value', 'back-button', 'complete-transaction-button', 'confirmation-status', 'status-badge', 'back-button', 'message-board', 'page-header', 'page-actions', 'back-button', 'complete-transaction-button', 'content-wrapper', 'main-content', 'status-grid', 'message-input', 'send-button', 'title-status-wrapper', 'confirmation-status', 'message-board', 'message-header-wrapper', 'confirmation-status', 'status-badge', 'permission-denied', 'permission-denied-content', 'back-button',];
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("platform-base") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("content-wrapper") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
        ...{ class: ("main-content trade-content") },
    });
    if (__VLS_ctx.permissionDenied) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("permission-denied") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("permission-denied-content") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.goBackToTradingTab) },
            ...{ class: ("back-button") },
        });
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("page-header") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("title-status-wrapper") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
            ...{ class: ("page-title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("page-actions") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.goBackToTradingTab) },
            ...{ class: ("back-button") },
        });
        if (__VLS_ctx.transaction &&
            __VLS_ctx.transaction.status !== 'completed' &&
            __VLS_ctx.transaction.status !== 'cancelled' &&
            (__VLS_ctx.canCompleteTransaction ||
                (__VLS_ctx.userRole === 'buyer' && __VLS_ctx.transaction?.buyerConfirmed) ||
                (__VLS_ctx.userRole === 'seller' && __VLS_ctx.transaction?.sellerConfirmed))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.completeTransaction) },
                ...{ class: ("complete-transaction-button") },
                ...{ class: (({
                        'waiting-confirmation': (__VLS_ctx.userRole === 'buyer' && __VLS_ctx.transaction?.buyerConfirmed) ||
                            (__VLS_ctx.userRole === 'seller' && __VLS_ctx.transaction?.sellerConfirmed),
                    })) },
                disabled: (((__VLS_ctx.userRole === 'buyer' && __VLS_ctx.transaction?.buyerConfirmed) ||
                    (__VLS_ctx.userRole === 'seller' && __VLS_ctx.transaction?.sellerConfirmed))),
            });
            ((__VLS_ctx.userRole === 'buyer' && __VLS_ctx.transaction?.buyerConfirmed) ||
                (__VLS_ctx.userRole === 'seller' && __VLS_ctx.transaction?.sellerConfirmed)
                ? '等待對方確認'
                : '完成交易');
        }
        if (__VLS_ctx.loading) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("status-message") },
            });
        }
        else if (__VLS_ctx.error && !__VLS_ctx.permissionDenied) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("status-message error") },
            });
            (__VLS_ctx.error);
        }
        else if (__VLS_ctx.transaction) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("transaction-container") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("content-grid") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("left-column") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: ("card transaction-status") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("status-item status-row") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
                ...{ class: (('status-' + __VLS_ctx.transaction.status)) },
            });
            (__VLS_ctx.formatStatus(__VLS_ctx.transaction.status));
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("status-row-container") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("status-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            (__VLS_ctx.transaction.amount);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("status-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            (__VLS_ctx.formatPrice(__VLS_ctx.transaction.price));
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("status-row-container") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("status-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            (__VLS_ctx.transaction.currency || '台幣');
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("status-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            (__VLS_ctx.transaction.paymentMethod || '匯款');
            __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: ("card seller-info") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("contact-info") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("info-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            (__VLS_ctx.transaction.seller.name);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("info-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            (__VLS_ctx.transaction.characterNickname || '未設定');
            if (__VLS_ctx.transaction.seller.contactInfo?.line) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("info-item") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("label") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("value") },
                });
                (__VLS_ctx.transaction.seller.contactInfo?.line);
            }
            if (__VLS_ctx.transaction.seller.contactInfo?.discord) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("info-item") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("label") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("value") },
                });
                (__VLS_ctx.transaction.seller.contactInfo?.discord);
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("right-column") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: ("card message-board") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("message-header-wrapper") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
            if (__VLS_ctx.transaction) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("confirmation-status") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("status-badge") },
                });
                (__VLS_ctx.transaction.sellerConfirmed ? '✅' : '❌');
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("status-badge") },
                });
                (__VLS_ctx.transaction.buyerConfirmed ? '✅' : '❌');
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("messages") },
            });
            for (const [message] of __VLS_getVForSourceType((__VLS_ctx.transaction.messages))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: ((message._id)),
                    ...{ class: ("message") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("message-header") },
                });
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("sender") },
                    ...{ class: ((message.sender === __VLS_ctx.transaction.seller._id
                            ? 'seller-message'
                            : 'buyer-message')) },
                });
                (message.sender === __VLS_ctx.transaction.seller._id
                    ? `${__VLS_ctx.transaction.seller.name} (賣家)`
                    : `${__VLS_ctx.transaction.buyer.name} (買家)`);
                __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: ("time") },
                });
                (__VLS_ctx.formatTime(message.timestamp));
                __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: ("message-content") },
                    ...{ class: ((message.sender === __VLS_ctx.transaction.seller._id
                            ? 'seller-message'
                            : 'buyer-message')) },
                });
                (message.content);
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("message-input") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
                ...{ onKeyup: (__VLS_ctx.sendMessage) },
                value: ((__VLS_ctx.newMessage)),
                placeholder: ("輸入訊息..."),
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.sendMessage) },
                ...{ class: ("send-button") },
                disabled: ((!__VLS_ctx.newMessage.trim())),
            });
        }
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("disclaimer") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    if (__VLS_ctx.notification.show) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ((['notification', `notification-${__VLS_ctx.notification.type}`])) },
        });
        (__VLS_ctx.notification.message);
    }
    ['platform-base', 'content-wrapper', 'main-content', 'trade-content', 'permission-denied', 'permission-denied-content', 'back-button', 'page-header', 'title-status-wrapper', 'page-title', 'page-actions', 'back-button', 'complete-transaction-button', 'waiting-confirmation', 'status-message', 'status-message', 'error', 'transaction-container', 'content-grid', 'left-column', 'card', 'transaction-status', 'status-item', 'status-row', 'label', 'value', 'status-row-container', 'status-item', 'label', 'value', 'status-item', 'label', 'value', 'status-row-container', 'status-item', 'label', 'value', 'status-item', 'label', 'value', 'card', 'seller-info', 'contact-info', 'info-item', 'label', 'value', 'info-item', 'label', 'value', 'info-item', 'label', 'value', 'info-item', 'label', 'value', 'right-column', 'card', 'message-board', 'message-header-wrapper', 'confirmation-status', 'status-badge', 'status-badge', 'messages', 'message', 'message-header', 'sender', 'time', 'message-content', 'message-input', 'send-button', 'disclaimer', 'notification',];
    var __VLS_slots;
    var $slots;
    let __VLS_inheritedAttrs;
    var $attrs;
    const __VLS_refs = {};
    var $refs;
    var $el;
    return {
        attrs: {},
        slots: __VLS_slots,
        refs: $refs,
        rootEl: $el,
    };
}
;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            transaction: transaction,
            newMessage: newMessage,
            loading: loading,
            error: error,
            permissionDenied: permissionDenied,
            sendMessage: sendMessage,
            formatTime: formatTime,
            formatPrice: formatPrice,
            goBackToTradingTab: goBackToTradingTab,
            canCompleteTransaction: canCompleteTransaction,
            notification: notification,
            completeTransaction: completeTransaction,
            formatStatus: formatStatus,
            userRole: userRole,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=TransactionDetailView.vue.js.map