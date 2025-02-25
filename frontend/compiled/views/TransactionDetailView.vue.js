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
// 載入交易詳情
const loadTransactionDetails = async () => {
    try {
        loading.value = true;
        const response = await transactionApi.getTransactionDetails(route.params.id);
        transaction.value = response.data;
    }
    catch (err) {
        error.value = err.message || '載入交易詳情失敗';
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
        error.value = err.message || '發送訊息失敗';
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
        currency: 'TWD',
        minimumFractionDigits: 0,
    }).format(price);
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
        showNotification(error.message || '結束交易失敗', 'error');
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
// 取得對方的資訊
const counterpartyInfo = computed(() => {
    if (!transaction.value)
        return null;
    return userRole.value === 'seller' ? transaction.value.buyer : transaction.value.seller;
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
    ['label', 'value', 'back-button', 'complete-transaction-button', 'complete-transaction-button', 'confirmation-status', 'status-badge', 'info-item', 'label', 'value', 'value', 'value', 'value', 'value', 'value', 'value', 'value', 'value', 'message-board', 'page-header', 'page-actions', 'back-button', 'complete-transaction-button', 'content-wrapper', 'main-content', 'contact-grid', 'status-grid', 'message-input', 'send-button', 'title-status-wrapper', 'confirmation-status', 'counterparty-info', 'info-grid', 'info-item', 'label', 'value', 'message-board', 'message-header-wrapper', 'confirmation-status', 'status-badge',];
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
    if (__VLS_ctx.canCompleteTransaction) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.completeTransaction) },
            ...{ class: ("complete-transaction-button") },
        });
    }
    if (__VLS_ctx.loading) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("status-message") },
        });
    }
    else if (__VLS_ctx.error) {
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
            ...{ class: ("status-grid") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("status-item") },
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
        if (__VLS_ctx.userRole) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
                ...{ class: ("card contact-card") },
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
            (__VLS_ctx.userRole === 'seller' ? __VLS_ctx.transaction.seller.name : __VLS_ctx.transaction.buyer.name);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("info-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            ((__VLS_ctx.userRole === 'seller'
                ? __VLS_ctx.transaction.seller.contactInfo?.line
                : __VLS_ctx.transaction.buyer.contactInfo?.line) || '未提供');
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("info-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            ((__VLS_ctx.userRole === 'seller'
                ? __VLS_ctx.transaction.seller.contactInfo?.discord
                : __VLS_ctx.transaction.buyer.contactInfo?.discord) || '未提供');
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("info-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            ((__VLS_ctx.userRole === 'seller'
                ? __VLS_ctx.transaction.seller.contactInfo?.facebook
                : __VLS_ctx.transaction.buyer.contactInfo?.facebook) || '未提供');
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
        if (__VLS_ctx.counterpartyInfo) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("counterparty-info") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            (__VLS_ctx.userRole === 'seller' ? '買家資訊' : '賣家資訊');
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("info-grid") },
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
            (__VLS_ctx.counterpartyInfo.name);
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("info-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            (__VLS_ctx.counterpartyInfo.contactInfo?.line || '未提供');
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("info-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            (__VLS_ctx.counterpartyInfo.contactInfo?.discord || '未提供');
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: ("info-item") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("label") },
            });
            __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: ("value") },
            });
            (__VLS_ctx.counterpartyInfo.contactInfo?.facebook || '未提供');
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
    ['platform-base', 'content-wrapper', 'main-content', 'trade-content', 'page-header', 'title-status-wrapper', 'page-title', 'page-actions', 'back-button', 'complete-transaction-button', 'status-message', 'status-message', 'error', 'transaction-container', 'content-grid', 'left-column', 'card', 'transaction-status', 'status-grid', 'status-item', 'label', 'value', 'status-item', 'label', 'value', 'status-item', 'label', 'value', 'card', 'contact-card', 'contact-info', 'info-item', 'label', 'value', 'info-item', 'label', 'value', 'info-item', 'label', 'value', 'info-item', 'label', 'value', 'right-column', 'card', 'message-board', 'message-header-wrapper', 'confirmation-status', 'status-badge', 'status-badge', 'counterparty-info', 'info-grid', 'info-item', 'label', 'value', 'info-item', 'label', 'value', 'info-item', 'label', 'value', 'info-item', 'label', 'value', 'messages', 'message', 'message-header', 'sender', 'time', 'message-content', 'message-input', 'send-button',];
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
            sendMessage: sendMessage,
            formatTime: formatTime,
            formatPrice: formatPrice,
            goBackToTradingTab: goBackToTradingTab,
            canCompleteTransaction: canCompleteTransaction,
            completeTransaction: completeTransaction,
            formatStatus: formatStatus,
            userRole: userRole,
            counterpartyInfo: counterpartyInfo,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEl: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=TransactionDetailView.vue.js.map