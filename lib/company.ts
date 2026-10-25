import { siteConfig } from "@/config/site.config";

const bank = {
  name: siteConfig.companyBankName,
  accountName: siteConfig.companyBankAccountName,
  accountNumber: siteConfig.companyBankAccountNumber,
};

export const COMPANY = {
  name: siteConfig.companyName,
  phone: siteConfig.companyPhone,
  alternatePhone: siteConfig.companyPhoneAlternate,
  email: siteConfig.companyEmail,
  salesEmail: siteConfig.companySalesEmail,
  address: siteConfig.companyAddress,
  tin: siteConfig.companyTin,
  registrationNumber: siteConfig.companyRegistrationNumber,
  website: siteConfig.companyWebsite,
  bank,
  paymentInstructions: [
    siteConfig.invoicePaymentInstructions,
    `Bank: ${bank.name}`,
    `Account name: ${bank.accountName}`,
    `Account number: ${bank.accountNumber}`,
    "Use your order number as the payment reference.",
  ]
    .filter(Boolean)
    .join("\n"),
};
