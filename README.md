# Saudimigos Mint Site

Built from the supplied On-Chain Skeletal site so the existing Robinhood Chain + Reown/AppKit wallet connection setup is preserved.

Updated:
- Contract: 0x45d6e251b4A0076b04182B71805972B45BE0f128
- WalletConnect/Reown project ID: 4f71172824a0ea69b0270161482356fe
- Robinhood Chain mainnet: 4663
- RPC: https://rpc.mainnet.chain.robinhood.com/
- Supply: 5,000
- Mint price: 0.00005 ETH
- Max per wallet: 100
- Live minted counter from contract
- Live mint price and mint status from contract
- Top supplied banner image
- Five supplied NFT images in an auto-rotating slider
- Favicon generated from supplied artwork
- Responsive mobile layout

Install:
npm install

Run:
npm run dev

Build:
npm run build

Deploy the generated dist/ folder to Vercel, Netlify, or another static host.


## Added in this version
- Mint progress: `X / 5,000 MINTED`
- Quantity controls: `− 1 +` and quick buttons `5 / 10 / 25 / 50 / MAX`
- Connected wallet section with mints, address, ETH balance and Blockscout wallet link
- OpenSea `VIEW COLLECTION` button (set the real collection URL in `src/config.js`)
- X `FOLLOW SAUDIMIGOS` button (set the real profile URL in `src/config.js`)
- Pixel loading overlay with supplied artwork
- Mint success screen with transaction link

- Compact unified slider + mint card layout with shared border and no gap
