<template>
    <v-container class="bank-transfers">
        <h2>Vos virements bancaires</h2>
        <p>Stripe gère les virements vers votre compte bancaire.</p>
        <p>Consultez votre compte Stripe pour connaître le calendrier et les frais applicables.</p>
        <p class="transfer-note">La fréquence des virements ne peut pas être modifiée depuis Covia.</p>
    </v-container>
</template>
<script>
export default {name:'select-virement-mode'};
</script>
<style scoped>
.bank-transfers{color:var(--font-color-label);background:var(--bg-app-color);max-width:640px;padding:24px 20px;}
.bank-transfers h2{font-size:1.3rem;margin:0 0 20px;}
.bank-transfers p{line-height:1.6;margin:0 0 16px;}
.transfer-note{color:var(--font-color-label);opacity:.75;}
</style>
