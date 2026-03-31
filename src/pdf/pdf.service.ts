import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private async generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });

    await browser.close();
    return Buffer.from(pdf);
  }

  private async uploadToCloudinary(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'raw',
          folder: 'propafric/documents',
          public_id: filename,
          format: 'pdf',
          type: 'upload',
          access_mode: 'public',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        },
      )
      .end(buffer);
  });
}

  async generateContractPdf(contract: any): Promise<string> {
    const html = this.buildContractHtml(contract);
    const buffer = await this.generatePdf(html);
    return buffer.toString('base64');
  }

  async generateQuittancePdf(payment: any): Promise<string> {
    const html = this.buildQuittanceHtml(payment);
    const buffer = await this.generatePdf(html);
    return buffer.toString('base64');
  }

  private buildContractHtml(contract: any): string {
    const startDate = new Date(contract.startDate).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; line-height: 1.6; }
        .header { background: #1A3C5E; color: white; padding: 20px; text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 22px; font-weight: bold; }
        .header p { font-size: 11px; opacity: 0.85; margin-top: 4px; }
        .agency-info { text-align: center; margin-bottom: 20px; }
        .agency-info h2 { color: #1A3C5E; font-size: 16px; }
        .title { text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline; margin: 20px 0; text-transform: uppercase; }
        .section { margin: 16px 0; }
        .section h3 { font-size: 13px; font-weight: bold; color: #1A3C5E; border-bottom: 1px solid #1A3C5E; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }
        .row { display: flex; margin: 4px 0; }
        .label { font-weight: bold; min-width: 200px; }
        .financial-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .financial-table th { background: #1A3C5E; color: white; padding: 8px; text-align: left; font-size: 11px; }
        .financial-table td { padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; }
        .financial-table tr:nth-child(even) td { background: #f0f5fa; }
        .total-row td { font-weight: bold; background: #D4A843 !important; color: white; }
        .article { margin: 8px 0; font-size: 11px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature-box { width: 45%; text-align: center; }
        .signature-box p { font-weight: bold; margin-bottom: 60px; }
        .signature-line { border-top: 1px solid #1a1a1a; padding-top: 8px; font-size: 11px; color: #666; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${contract.agency?.name || 'PropAfric'}</h1>
        <p>${contract.agency?.address || ''} — Tél: ${contract.agency?.phone || ''}</p>
      </div>

      <div class="title">Contrat de Location</div>

      <div class="section">
        <h3>Entre les soussignés</h3>
        <div class="row">
          <span class="label">Bailleur (représenté par) :</span>
          <span>${contract.agency?.name || 'L\'agence'}</span>
        </div>
        <div class="row">
          <span class="label">Propriétaire :</span>
          <span>${contract.property?.owner?.firstName} ${contract.property?.owner?.lastName}</span>
        </div>
        <p style="margin-top: 8px">Ci-après dénommé <strong>le bailleur</strong> d'une part,</p>
        <div style="margin-top: 12px">
          <div class="row">
            <span class="label">Locataire :</span>
            <span>${contract.tenant?.firstName} ${contract.tenant?.lastName}</span>
          </div>
          <div class="row">
            <span class="label">Téléphone :</span>
            <span>${contract.tenant?.phone}</span>
          </div>
        </div>
        <p style="margin-top: 8px">Ci-après dénommé <strong>le preneur</strong> d'autre part.</p>
      </div>

      <div class="section">
        <h3>1 — Désignation du bien</h3>
        <div class="row"><span class="label">Type :</span><span>${contract.property?.type}</span></div>
        <div class="row"><span class="label">Nom :</span><span>${contract.property?.name}</span></div>
        <div class="row"><span class="label">Adresse :</span><span>${contract.property?.address}</span></div>
        <div class="row"><span class="label">Usage :</span><span>${contract.type === 'HABITATION' ? 'Habitation' : 'Professionnel'}</span></div>
      </div>

      <div class="section">
        <h3>2 — Durée du bail</h3>
        <p>Le présent bail est consenti et accepté pour une durée indéterminée, renouvelable par tacite reconduction, prenant effet le <strong>${startDate}</strong>.</p>
        <p style="margin-top: 6px">Le préavis est de <strong>six (6) mois</strong> pour le bailleur et de <strong>deux (2) mois</strong> pour le locataire.</p>
      </div>

      <div class="section">
        <h3>3 — Loyer et charges</h3>
        <table class="financial-table">
          <thead>
            <tr>
              <th>Composante</th>
              <th>Montant (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Loyer de base HT</td><td>${contract.rentBase?.toLocaleString('fr-FR')} F</td></tr>
            <tr><td>Charges</td><td>${contract.charges?.toLocaleString('fr-FR')} F</td></tr>
            <tr><td>TOM (${contract.tax}%)</td><td>${contract.tom?.toLocaleString('fr-FR')} F</td></tr>
            <tr><td>Frais de gestion TTC</td><td>${contract.managementFee?.toLocaleString('fr-FR')} F</td></tr>
            <tr class="total-row"><td>LOYER TTC MENSUEL</td><td>${contract.rentTTC?.toLocaleString('fr-FR')} F</td></tr>
          </tbody>
        </table>
        <p style="margin-top: 8px">Le loyer est payable mensuellement avant le <strong>5 de chaque mois</strong> par espèces, chèque ou virement bancaire.</p>
      </div>

      <div class="section">
        <h3>4 — Caution</h3>
        <p>Le preneur versera à l'entrée dans les lieux la somme de <strong>${contract.deposit?.toLocaleString('fr-FR')} FCFA</strong> à titre de caution non productive d'intérêts.</p>
      </div>

      <div class="section">
        <h3>5 — Charges et conditions</h3>
        <div class="article"><strong>Art 1 :</strong> Le preneur prendra les lieux loués dans l'état où ils se trouveront.</div>
        <div class="article"><strong>Art 2 :</strong> Le preneur entretiendra les lieux loués pendant toute la durée du bail.</div>
        <div class="article"><strong>Art 6 :</strong> Le preneur s'engage à ne pas sous-louer sans le consentement écrit du bailleur.</div>
        <div class="article"><strong>Art 7 :</strong> Le preneur contractera une assurance incendie couvrant ses biens propres et les risques locatifs.</div>
        <div class="article"><strong>Art 8 :</strong> Le preneur s'acquittera de ses factures d'eau, d'électricité et de téléphone.</div>
      </div>

      <div class="section">
        <h3>6 — Révision du loyer</h3>
        <p>Le bailleur procédera à la révision triennale (tous les 3 ans) du montant du loyer de base en fonction de l'indice de construction de la ville de Dakar.</p>
      </div>

      <div class="section">
        <h3>7 — Litiges</h3>
        <p>En cas de litige et à défaut de solution amiable, l'affaire sera portée devant les tribunaux compétents de Dakar.</p>
      </div>

      <div class="signatures">
        <div class="signature-box">
          <p>Le Bailleur</p>
          <div class="signature-line">Signature et cachet</div>
        </div>
        <div class="signature-box">
          <p>Le Preneur</p>
          <div class="signature-line">Mention « Lu et approuvé »</div>
        </div>
      </div>

      <div class="footer">
        <p>Référence contrat : ${contract.reference} — Dakar, le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    </body>
    </html>`;
  }

  private buildQuittanceHtml(payment: any): string {
    const paidDate = new Date(payment.paidAt).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const MONTHS = [
      'Janvier','Février','Mars','Avril','Mai','Juin',
      'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
    ];

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; line-height: 1.6; }
        .header { background: #1A3C5E; color: white; padding: 20px; text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 22px; font-weight: bold; }
        .header p { font-size: 11px; opacity: 0.85; margin-top: 4px; }
        .title { text-align: center; font-size: 18px; font-weight: bold; text-decoration: underline; margin: 20px 0; text-transform: uppercase; }
        .subtitle { text-align: center; font-size: 14px; color: #1A3C5E; margin-bottom: 30px; }
        .reference { text-align: right; font-size: 11px; color: #666; margin-bottom: 20px; }
        .section { margin: 16px 0; padding: 12px; background: #f8fafc; border-left: 4px solid #1A3C5E; }
        .row { display: flex; margin: 4px 0; }
        .label { font-weight: bold; min-width: 200px; }
        .financial-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .financial-table th { background: #1A3C5E; color: white; padding: 10px; text-align: left; }
        .financial-table td { padding: 8px 10px; border: 1px solid #ddd; }
        .financial-table tr:nth-child(even) td { background: #f0f5fa; }
        .total-row td { font-weight: bold; font-size: 14px; background: #D4A843 !important; color: white; }
        .paid-stamp { text-align: center; margin: 20px 0; }
        .paid-stamp span { display: inline-block; border: 3px solid #27AE60; color: #27AE60; font-size: 24px; font-weight: bold; padding: 8px 24px; transform: rotate(-10deg); }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
        .signature { margin-top: 40px; text-align: right; }
        .signature p { font-weight: bold; margin-bottom: 50px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${payment.contract?.agency?.name || 'PropAfric'}</h1>
        <p>${payment.contract?.agency?.address || ''}</p>
      </div>

      <div class="title">Quittance de Loyer</div>
      <div class="subtitle">${MONTHS[payment.month - 1]} ${payment.year}</div>

      <div class="reference">
        Référence : ${payment.reference} — Dakar, le ${paidDate}
      </div>

      <div class="section">
        <div class="row"><span class="label">Locataire :</span><span>${payment.contract?.tenant?.firstName} ${payment.contract?.tenant?.lastName}</span></div>
        <div class="row"><span class="label">Téléphone :</span><span>${payment.contract?.tenant?.phone}</span></div>
        <div class="row"><span class="label">Bien loué :</span><span>${payment.contract?.property?.name}</span></div>
        <div class="row"><span class="label">Adresse :</span><span>${payment.contract?.property?.address}</span></div>
      </div>

      <table class="financial-table">
        <thead>
          <tr>
            <th>Désignation</th>
            <th>Montant (FCFA)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Loyer de base HT</td><td>${payment.contract?.rentBase?.toLocaleString('fr-FR')} F</td></tr>
          <tr><td>Charges</td><td>${payment.contract?.charges?.toLocaleString('fr-FR')} F</td></tr>
          <tr><td>TOM</td><td>${payment.contract?.tom?.toLocaleString('fr-FR')} F</td></tr>
          <tr><td>Frais de gestion TTC</td><td>${payment.contract?.managementFee?.toLocaleString('fr-FR')} F</td></tr>
          <tr class="total-row"><td>TOTAL RÉGLÉ</td><td>${payment.amount?.toLocaleString('fr-FR')} F</td></tr>
        </tbody>
      </table>

      <div class="paid-stamp">
        <span>PAYÉ</span>
      </div>

      <div class="section">
        <div class="row"><span class="label">Date de paiement :</span><span>${paidDate}</span></div>
        <div class="row"><span class="label">Mode de paiement :</span><span>${payment.paymentMethod}</span></div>
        <div class="row"><span class="label">Contrat référence :</span><span>${payment.contract?.reference}</span></div>
      </div>

      <div class="signature">
        <p>La Direction</p>
        <div style="border-top: 1px solid #1a1a1a; width: 200px; margin-left: auto; padding-top: 8px; font-size: 11px; color: #666;">Signature et cachet</div>
      </div>

      <div class="footer">
        <p>Ce document tient lieu de quittance de loyer pour la période indiquée.</p>
        <p>${payment.contract?.agency?.name || 'PropAfric'} — ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    </body>
    </html>`;
  }
}