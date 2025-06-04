import Image from "next/image";
import Stripe from "stripe";

import { capitalizeFirstLetter, cn } from "@/lib/utils";

interface Props {
  card: Stripe.PaymentMethod.Card;
  maskNums?: boolean;
  className?: string;
}

export function CreditCardInfo({ card, maskNums, className }: Props) {
  let numGroups = [4, 4, 4, 4];
  let imgSrc = null;
  switch (card.brand) {
    case "amex":
      numGroups = [4, 6, 5];
      imgSrc = "/images/card-brands/amex.svg";
      break;
    case "diners":
      imgSrc = "/images/card-brands/diners.svg";
      break;
    case "discover":
      imgSrc = "/images/card-brands/discover.svg";
      break;
    case "jcb":
      imgSrc = "/images/card-brands/jcb.svg";
      break;
    case "mastercard":
      imgSrc = "/images/card-brands/mastercard.svg";
      break;
    case "visa":
      imgSrc = "/images/card-brands/visa.svg";
      break;
    default:
      console.warn("Unknown card brand", card.brand);
  }

  let maskedNums = "";
  for (let i = 0; i < numGroups.length; i++) {
    maskedNums += new Array(numGroups[i]).fill("●").join("");
    maskedNums += " ";
  }
  maskedNums.slice(maskedNums.length - 4);
  maskedNums += card.last4;

  const prefix = capitalizeFirstLetter(card.brand);

  return (
    <div className={cn("flex items-start items-center gap-1", className)}>
      {imgSrc && <Image src={imgSrc} alt={card.brand} width={28} height={20} />}
      <p className="leading-relaxed text-sm">
        {maskNums ? (
          maskedNums
        ) : (
          <>
            {prefix} ending {card.last4}
          </>
        )}
      </p>
    </div>
  );
}
