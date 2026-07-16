(function() {
// questions.js
    // =====================================================================
    // Dynamic intelligent question bank (capacity: 130 questions, ideal sweet spot)
    // =====================================================================
    const rawQuestionBank = [
        // --- Dimension A: Sensory preferences and aesthetics (self-assessment pool) ---
        { type: 'likert', d: 'A', r: false, t: "When arranging my personal space, I prefer an environment that gives me a sense of safety like being softly wrapped, rather than a minimalist or hard-edged style." },
        { type: 'likert', d: 'A', r: false, t: "When buying everyday items such as stationery or cups, I am willing to sacrifice a little practicality if the shape is delicate and cute enough." },
        { type: 'likert', d: 'A', r: false, t: "When watching films, shows, or games, I often notice the fabric texture, drape, and detailed patterns of a character's clothing." },
        { type: 'likert', d: 'A', r: true,  t: "[Reverse] I think the only standard for daily outfits is that they resist dirt, wear well, and allow easy movement; extra decoration is pure burden." },
        { type: 'likert', d: 'A', r: false, t: "Compared with strong contrasting colors or dark styles, I naturally like low-saturation, soft color palettes such as pale tones and macaron colors." },
        { type: 'likert', d: 'A', r: false, t: "I feel that moderate self-grooming, such as keeping hair smooth and skin pleasant to touch, feels more comfortable than a rough-guy image." },
        { type: 'likert', d: 'A', r: false, t: "I am occasionally attracted to extremely delicate, small handcrafted items or accessories, even if they have no practical value for me." },
        { type: 'likert', d: 'A', r: true,  t: "[Reverse] I completely cannot understand why anyone would add useless plush parts or charms to objects." },
        { type: 'likert', d: 'A', r: false, t: "I find designs with some curves or drape more beautiful than blunt geometric straight lines." },
        { type: 'likert', d: 'A', r: false, t: "When buying clothes, even an ordinary T-shirt makes me care a lot about whether the neckline looks slimming and whether the sleeves have a nice drape." },
        { type: 'likert', d: 'A', r: false, t: "I have almost no resistance to daily products with fruity, milky, or floral scents, such as body wash or hand cream." },
        { type: 'likert', d: 'A', r: false, t: "Compared with metal or plastic, I subconsciously prefer touching extremely soft materials such as coral fleece or silk." },
        { type: 'likert', d: 'A', r: true,  t: "[Reverse] If I had to use pink bedsheets or a pink duvet cover, I would feel very awkward or even be unable to sleep." },
        { type: 'likert', d: 'A', r: false, t: "When eating desserts or visually appealing food, my first reaction is often to appreciate the presentation and take a photo, rather than immediately eating big bites." },
        { type: 'likert', d: 'A', r: false, t: "I care a lot about how I smell; even a little odd odor or sweat smell on my clothes makes me extremely uncomfortable." },
        { type: 'likert', d: 'A', r: true,  t: "[Reverse] When buying shoes, I only care whether they are non-slip and durable, and I do not care at all whether they make my feet look big or small." },
        { type: 'likert', d: 'A', r: false, t: "In winter, I especially like the feeling of tucking my hands into wide sleeves with only a little bit of my fingers showing." },
        { type: 'likert', d: 'A', r: false, t: "When eating fruit or small snacks, I like cutting them into very small pieces or plating them delicately before eating." },
        { type: 'likert', d: 'A', r: false, t: "When I see very delicate cakes or macarons, even if I am not hungry, I may want to buy them just because they look pretty." },
        { type: 'likert', d: 'A', r: false, t: "I care about hand care; after washing my hands in winter, I habitually apply hand cream to avoid dryness." },
        { type: 'likert', d: 'A', r: true,  t: "[Reverse] I do not understand why water cups need different colors and shapes; holding water without leaking is enough." },

        // --- Dimension B: Body, space, and self-management (self-assessment pool) ---
        { type: 'likert', d: 'B', r: false, t: "When sitting down in public, my body habits lean more toward keeping myself compact to avoid taking up too much space, rather than casually spreading out." },
        { type: 'likert', d: 'B', r: false, t: "I am very sensitive to how my skin feels; if some part of my skin is dry or flaky, I feel uncomfortable and want to apply something to improve it." },
        { type: 'likert', d: 'B', r: false, t: "When closing doors, putting down cups, or typing on a keyboard, I usually control my strength subconsciously and try not to make rough collision sounds." },
        { type: 'likert', d: 'B', r: false, t: "I care about a sense of cleanliness in my body, and details such as obvious body hair or uneven nail edges bother me." },
        { type: 'likert', d: 'B', r: true,  t: "[Reverse] My movements are usually fairly large when picking things up, and I do not think it matters if I occasionally knock over small nearby objects." },
        { type: 'likert', d: 'B', r: false, t: "When relaxing alone at home, I like wearing clothes that are clearly oversized, very soft, and can cover me up inside." },
        { type: 'likert', d: 'B', r: false, t: "When eating packaged snacks, I tend to tear open a neat small opening instead of violently ripping the whole package apart." },
        { type: 'likert', d: 'B', r: false, t: "When posing for photos, I rarely make very aggressive or extremely goofy gestures, and I lean toward more restrained poses." },
        { type: 'likert', d: 'B', r: true,  t: "[Reverse] I do not care at all whether my clothes are slightly wrinkled; as long as they are not torn, I can wear them out directly." },
        { type: 'likert', d: 'B', r: false, t: "When I hear a sudden loud noise, such as a balloon popping or a heavy object falling, my body subconsciously tenses up or trembles slightly." },
        { type: 'likert', d: 'B', r: false, t: "When drinking water or eating, I am used to small bites and sips rather than wolfing things down." },
        { type: 'likert', d: 'B', r: false, t: "When drinking a hot beverage while holding a mug with both hands, I feel that this posture gives a sense of comfort." },
        { type: 'likert', d: 'B', r: false, t: "When yawning or laughing loudly, I subconsciously lower my head slightly or cover my mouth with my hand." },
        { type: 'likert', d: 'B', r: true,  t: "[Reverse] I take large strides when walking, swing my arms noticeably, and feel that walking this way has momentum." },
        { type: 'likert', d: 'B', r: false, t: "When walking, my toes usually point straight forward or slightly inward, and I almost never walk with my toes turned outward." },
        { type: 'likert', d: 'B', r: false, t: "When resting on a sofa, I prefer curling up and holding my legs rather than stretching them straight out." },
        { type: 'likert', d: 'B', r: true,  t: "[Reverse] I think making sounds while eating or chewing loudly is very normal, and I do not care about these details." },
        { type: 'likert', d: 'B', r: false, t: "If a small object falls on the ground, I usually squat down with my legs together to pick it up, rather than bending over with my legs spread apart." },
        { type: 'likert', d: 'B', r: false, t: "After washing my face, I habitually press a towel gently to absorb moisture, instead of rubbing roughly back and forth on my face." },
        { type: 'likert', d: 'B', r: false, t: "When I feel cold, I subconsciously cross my arms in front of my chest or raise my shoulders and tuck my neck in for warmth." },
        { type: 'likert', d: 'B', r: true,  t: "[Reverse] I often walk around shirtless at home and feel that this is the most relaxed and free." },

        // --- Dimension C: Emotional resonance and defense mechanisms (self-assessment pool) ---
        { type: 'likert', d: 'C', r: false, t: "When playing an immersive story game, if I had to choose between being a lone hero saving the world and being unconditionally protected by a powerful being, I honestly long for the latter more." },
        { type: 'likert', d: 'C', r: false, t: "When watching movies, I am more easily saddened by subtle regrets and emotional bonds between characters than by grand tragic scenes." },
        { type: 'likert', d: 'C', r: false, t: "When I am frustrated in a task, I would rather hear, \"It's okay, you have already done well, take a break,\" than someone telling me, \"You need to be strong.\"" },
        { type: 'likert', d: 'C', r: true,  t: "[Reverse] I believe that to survive in society, one must never easily show weakness or tears to others." },
        { type: 'likert', d: 'C', r: false, t: "In teamwork, I prefer providing emotional value and supportive help rather than bearing the pressure of making final decisions." },
        { type: 'likert', d: 'C', r: false, t: "I easily notice subtle emotional changes in the person I am talking to, such as a weaker tone or evasive eyes." },
        { type: 'likert', d: 'C', r: false, t: "Sometimes I feel an inexplicable fatigue and want to unload all the sense of responsibility society gives me, simply becoming someone who is cared for." },
        { type: 'likert', d: 'C', r: false, t: "When others vent to me, my first reaction is usually to empathize with their grievance, rather than immediately point out logical flaws and give solutions." },
        { type: 'likert', d: 'C', r: true,  t: "[Reverse] I strongly dislike people who get emotional over small things and feel they are not rational enough." },
        { type: 'likert', d: 'C', r: false, t: "I develop feelings for inanimate objects that have accompanied me for a long time, such as pillows or old stationery, and throwing them away gives me strong guilt." },
        { type: 'likert', d: 'C', r: false, t: "In a heated argument, even if I am right, once the other person raises their voice and shouts, my first reaction is often a physical urge to cry or retreat rather than argue back." },
        { type: 'likert', d: 'C', r: false, t: "Compared with actively pursuing someone I like, deep down I more strongly desire to be firmly chosen and favored by a gentle person." },
        { type: 'likert', d: 'C', r: true,  t: "[Reverse] When friends ask for help, if I think the request is unreasonable, I will reject it very decisively and coldly without hesitation." },
        { type: 'likert', d: 'C', r: false, t: "When I make a mistake and am criticized, I care a lot about the other person's tone, and even a small reproach can make me feel bad for a long time." },
        { type: 'likert', d: 'C', r: false, t: "When I disagree with others, I often choose to compromise first or admit fault first to avoid intense conflict." },
        { type: 'likert', d: 'C', r: false, t: "I often internally dwell for a long time on a casually harsh sentence from someone else, repeatedly wondering whether I did something wrong." },
        { type: 'likert', d: 'C', r: true,  t: "[Reverse] I believe that in an intimate relationship, I must be the absolute leader who controls the whole situation and protects the other person." },
        { type: 'likert', d: 'C', r: false, t: "When I see someone else being very embarrassed or unable to save face, I also feel strong secondhand embarrassment and physical discomfort, sometimes to the point of not daring to look." },
        { type: 'likert', d: 'C', r: false, t: "Late at night when everything is quiet, I sometimes hug a blanket or pillow tightly and feel that the light pressure can ease my loneliness." },
        { type: 'likert', d: 'C', r: true,  t: "[Reverse] I believe in ruthless competitiveness and feel that overflowing sympathy is the biggest obstacle to a person's success." },

        // --- Dimension D: Social context and boundaries (self-assessment pool) ---
        { type: 'likert', d: 'D', r: false, t: "In online social interactions, I rely heavily on kaomoji, tildes (~), or non-aggressive cute reaction images to soften my tone or express friendliness." },
        { type: 'likert', d: 'D', r: false, t: "In a completely anonymous online community, I am more inclined to create a gentle persona without obvious gendered aggressiveness." },
        { type: 'likert', d: 'D', r: false, t: "If a friend who is usually very tough suddenly shows a very delicate or even emotionally vulnerable side, I think it is normal and may even want to comfort them." },
        { type: 'likert', d: 'D', r: false, t: "When playing online games, if a random teammate misjudges my gender, I usually cannot be bothered to deliberately clarify as long as it does not affect the game." },
        { type: 'likert', d: 'D', r: true,  t: "[Reverse] If someone online calls me by a slightly feminine or cute nickname, I feel very annoyed and correct them immediately." },
        { type: 'likert', d: 'D', r: false, t: "With close friends I know well, I do not mind them making jokes about my gender traits, such as calling me \"wifey\" or similar memes." },
        { type: 'likert', d: 'D', r: false, t: "I think the word \"cute\" is high praise for a person, even when it is used about me." },
        { type: 'likert', d: 'D', r: false, t: "When choosing an online avatar, I more often use soft-styled, anime, or cute animal images rather than scenery, cars, or cold characters." },
        { type: 'likert', d: 'D', r: true,  t: "[Reverse] I would never use anime cute-girl reaction images on any social platform because I think they are too childish." },
        { type: 'likert', d: 'D', r: false, t: "I occasionally use playful reduplicated words with very close friends, such as cutesy versions of \"eat\" or \"sleep,\" to liven the mood or show mild coquettishness." },
        { type: 'likert', d: 'D', r: false, t: "If there were a high-quality afternoon tea restaurant only women could enter, I have imagined how nice it would be if I could blend in and experience it once." },
        { type: 'likert', d: 'D', r: false, t: "When watching anime, movies, or shows, I actually enjoy slow-paced, warm, healing slice-of-life or cute-relaxing works more than hot-blooded battle series." },
        { type: 'likert', d: 'D', r: false, t: "I have a high acceptance of, or even immerse myself in, VTubers and online cultures built around cute personas." },
        { type: 'likert', d: 'D', r: false, t: "In my input method, the first few frequently used reaction images are usually soft, aggrieved, or crying ones." },
        { type: 'likert', d: 'D', r: false, t: "In multiplayer team games, I actually enjoy playing pure support or healer roles, quietly following behind others to heal and be protected." },
        { type: 'likert', d: 'D', r: true,  t: "[Reverse] When chatting, I am used to sending only text, often without even punctuation, and I absolutely do not use emojis or kaomoji." },
        { type: 'likert', d: 'D', r: false, t: "If an elder or someone I do not know well praises me as quiet, gentle, or delicate-looking, I do not actually feel offended inside." },
        { type: 'likert', d: 'D', r: false, t: "In anonymous group chats, compared with being the central person who leads topics, I prefer being the mascot who occasionally sends cute reaction images." },
        { type: 'likert', d: 'D', r: false, t: "I easily develop unexplained fondness and dependence online toward people with extremely gentle tones or pleasant voices." },
        { type: 'likert', d: 'D', r: true,  t: "[Reverse] I think friendship between men should be built on hardcore interactions like jokingly calling each other father and son and drinking heavily." },

        // ================= Scenario simulation question pool (choice type) =================
        // A scenarios
        { type: 'choice', d: 'A', t: "If you could add one thing to an empty corner of your bedroom, you would most likely choose:", options: [
            { v: 1, l: "A set of dumbbells or simple fitness equipment" }, { v: 2, l: "A practical storage shelf" },
            { v: 4, l: "A lively green plant" }, { v: 5, l: "An extremely soft beanbag chair you can sink into" } ]},
        { type: 'choice', d: 'A', t: "When choosing an air freshener or fragrance to spray in your bedroom, you would lean toward:", options: [
            { v: 1, l: "Whatever, as long as it removes odors" }, { v: 2, l: "A clean, cool pine scent after rain" },
            { v: 4, l: "A light white tea or citrus scent" }, { v: 5, l: "A slightly sweet vanilla, milk, or peach scent" } ]},
        { type: 'choice', d: 'A', t: "When choosing a personal digital product such as headphones, if the sound quality is similar:", options: [
            { v: 1, l: "I only look at which one is cheaper and more durable" }, { v: 2, l: "I choose the most classic pure black or dark gray" },
            { v: 4, l: "I choose white or a simple, compact design" }, { v: 5, l: "A special macaron color or stylish appearance can instantly win me over" } ]},
        { type: 'choice', d: 'A', t: "On a rainy day, what kind of umbrella would you prefer to carry?", options: [
            { v: 1, l: "A large black umbrella with thick ribs; blocking rain matters most" }, { v: 2, l: "An ordinary solid-color folding umbrella" },
            { v: 4, l: "A transparent umbrella or one with fresher colors" }, { v: 5, l: "A light umbrella with small design details such as lace trim, gradients, or subtle patterns" } ]},
        { type: 'choice', d: 'A', t: "If a friend gave you a beautiful set of multicolor journal highlighters, you would:", options: [
            { v: 1, l: "Throw them in a drawer to gather dust and barely use them" }, { v: 2, l: "Occasionally take one out to mark something casually" },
            { v: 4, l: "Pay attention to color matching while writing so the page looks better" }, { v: 5, l: "Unable to resist arranging them neatly in a color gradient; just looking at them feels healing" } ]},
        { type: 'choice', d: 'A', t: "When buying shampoo at the supermarket, the reason you finally choose one is:", options: [
            { v: 1, l: "A hardcore slogan about strong oil control and dandruff removal" }, { v: 2, l: "Large capacity on sale with good value" },
            { v: 4, l: "The packaging design looks simple and premium" }, { v: 5, l: "I tried smelling it and it had a very pleasant floral-fruity or cherry blossom scent" } ]},
        { type: 'choice', d: 'A', t: "When choosing a phone case, which style would you lean toward?", options: [
            { v: 1, l: "A pure black, military-grade hard case for drop protection" }, { v: 2, l: "A clear silicone case showing the original color" },
            { v: 4, l: "A thin case with simple illustration or light colors" }, { v: 5, l: "A cute case with raised decorations, plush charms, or flowing glitter" } ]},
        { type: 'choice', d: 'A', t: "At a stationery store, when choosing a notebook for journaling, you would pick:", options: [
            { v: 1, l: "A pure black business-style thick leather notebook" }, { v: 2, l: "An ordinary kraft-paper spiral notebook" },
            { v: 4, l: "A notebook with a fresh, soft cover color and delicate paper" }, { v: 5, l: "A hardcover notebook with beautiful illustrations and even a strap or magnetic clasp design" } ]},

        // B scenarios
        { type: 'choice', d: 'B', t: "When faced with an extremely hard-to-open glass jar lid, your first reaction is usually:", options: [
            { v: 1, l: "Use all my strength and fight it; if that fails, pry it with a knife" }, { v: 3, l: "Use a cloth for grip or run it under hot water before trying again" },
            { v: 4, l: "Try twice, give up for the moment, and come back later" }, { v: 5, l: "Subconsciously want to take it to someone stronger nearby for help" } ]},
        { type: 'choice', d: 'B', t: "On a rest day when the weather gets slightly colder, your way to keep warm at home is:", options: [
            { v: 1, l: "Turn on the AC or casually put on an old jacket" }, { v: 2, l: "Put on regular thermal underwear" },
            { v: 4, l: "Cover my legs with a blanket" }, { v: 5, l: "Change into thick fleece loungewear that feels extremely warm, or put on long warm socks" } ]},
        { type: 'choice', d: 'B', t: "When drinking a beverage with a straw, your subconscious habit is:", options: [
            { v: 1, l: "Take big pulls and finish it in a few sips" }, { v: 2, l: "Bite the straw flat with my molars out of boredom while drinking" },
            { v: 4, l: "Gently sip from the straw opening with only my lips" }, { v: 5, l: "Subconsciously bite the edge of the straw lightly with my front teeth, leaving faint marks" } ]},
        { type: 'choice', d: 'B', t: "When tidying extremely messy cables and small items on your desk, you would:", options: [
            { v: 1, l: "Grab everything and stuff it deep into a drawer" }, { v: 2, l: "Tie them casually with a rubber band and throw them in a box" },
            { v: 4, l: "Patiently straighten and coil them one by one" }, { v: 5, l: "Not only straighten them, but also fix them neatly with dedicated cable ties or nice-looking clips" } ]},
        { type: 'choice', d: 'B', t: "When walking with several people on a not-very-wide sidewalk and pedestrians approach from the opposite direction, you would:", options: [
            { v: 1, l: "Walk straight ahead and wait for them to move aside" }, { v: 2, l: "Turn my shoulder slightly" },
            { v: 4, l: "Actively turn sideways and slow down to let them pass first" }, { v: 5, l: "Not only make way, but also subconsciously pull my arms close to my body to make myself smaller" } ]},
        { type: 'choice', d: 'B', t: "When a friend tells an extremely exaggerated and funny joke, your physical reaction is:", options: [
            { v: 1, l: "Laugh wildly without restraint and slap my thigh hard" }, { v: 2, l: "Laugh out loud normally" },
            { v: 4, l: "Laugh happily, but without large body movements" }, { v: 5, l: "When laughing hard, I unconsciously cover my mouth slightly or hold my stomach" } ]},
        { type: 'choice', d: 'B', t: "When taking the subway or bus, if there is an empty seat beside you, your sitting posture is usually:", options: [
            { v: 1, l: "Legs spread wide, taking maximum space and very relaxed" }, { v: 2, l: "Legs naturally parallel, proper and ordinary" },
            { v: 4, l: "Legs lightly together or ankles crossed" }, { v: 5, l: "Legs tightly together, with hands even neatly and obediently folded on my knees" } ]},
        { type: 'choice', d: 'B', t: "When eating a large burger or a sandwich stuffed with fillings, you would:", options: [
            { v: 1, l: "Open my mouth wide and take a big bite, eating very boldly" }, { v: 2, l: "Eat normally; crumbs or sauce on my face do not matter" },
            { v: 4, l: "Press the bread down a little before eating and try not to drop crumbs" }, { v: 5, l: "Eat very carefully, afraid of dirtying the corners of my mouth, and may even cover my mouth with a hand or tissue while eating" } ]},

        // C scenarios
        { type: 'choice', d: 'C', t: "When listening to a very sad instrumental melody with no lyrics, what reaction are you more likely to have?", options: [
            { v: 1, l: "No real feeling; I just think the tune is slow" }, { v: 2, l: "I think it would work as game background music" },
            { v: 4, l: "Some personal memories come to mind and I feel a little down" }, { v: 5, l: "It feels like my heart is gently squeezed, and I want to curl up" } ]},
        { type: 'choice', d: 'C', t: "When your small mistake ruins a friend's plan and they get angry at you, you would:", options: [
            { v: 1, l: "Think they are overreacting and snap back directly" }, { v: 2, l: "Suppress my emotions, rationally analyze the cause, and promise compensation" },
            { v: 4, l: "Feel very guilty and keep lowering my head to apologize" }, { v: 5, l: "Get red-eyed, feel wronged and deeply self-blaming, and may even cry" } ]},
        { type: 'choice', d: 'C', t: "If you see a very clean but tiny stray cat meowing at you on the road, you would:", options: [
            { v: 1, l: "Feel nothing and stride right past" }, { v: 2, l: "Think it is pitiful, but I am in a hurry and cannot deal with it" },
            { v: 4, l: "Stop, squat down, and make sounds to tease it a little" }, { v: 5, l: "Internally shout \"so cute\" and strongly want to hold it in my arms and comfort it" } ]},
        { type: 'choice', d: 'C', t: "When you feel greatly wronged or are under pressure near collapse, your preferred way to vent is:", options: [
            { v: 1, l: "Exercise like crazy, play games, or find somewhere to release violent emotions" }, { v: 2, l: "Sleep alone with my head down and ignore everyone" },
            { v: 4, l: "Pour everything out to my closest friend" }, { v: 5, l: "Desperately want a hug and want to cry hard in front of someone who can accept me" } ]},
        { type: 'choice', d: 'C', t: "When a short video reports an elderly person living alone crying because of hardship, your reaction is:", options: [
            { v: 1, l: "Think it is pity-bait and swipe away immediately" }, { v: 2, l: "Sigh inwardly that life is not easy" },
            { v: 4, l: "Feel heavy and leave a comforting comment" }, { v: 5, l: "Strongly empathize, my own eyes redden too, and I may not recover for quite a while" } ]},
        { type: 'choice', d: 'C', t: "In a group assignment, if the leader assigns you far more work than everyone else, you would:", options: [
            { v: 1, l: "Slam the table on the spot, fall out with them, and refuse" }, { v: 3, l: "Refute with clear reasons and demand redistribution" },
            { v: 4, l: "Although unwilling, silently finish the work anyway" }, { v: 5, l: "Not dare refuse face to face, silently endure the grievance, then feel worse and worse under the covers at night" } ]},
        { type: 'choice', d: 'C', t: "If your partner or extremely close friend is much stronger or more capable than you, the relationship mode you subconsciously want is:", options: [
            { v: 1, l: "It must be absolutely equal, competing to see who is better, with neither yielding" }, { v: 2, l: "Mutual respect while each keeps independent space" },
            { v: 4, l: "Occasionally be lazy and rely on them, letting them make decisions" }, { v: 5, l: "Deeply enjoy being fully accepted by them, even spoiled and cared for in every way like a child" } ]},
        { type: 'choice', d: 'C', t: "When watching a horror movie or playing a horror game and suddenly encountering a jump scare, your real reaction is:", options: [
            { v: 1, l: "Angrily curse and may even want to smash the mouse" }, { v: 2, l: "Freeze for a moment, then keep watching with a blank face" },
            { v: 4, l: "Close my eyes tightly or cover the screen because I do not dare look" }, { v: 5, l: "Subconsciously let out a short scream and instantly hug a pillow or the person beside me" } ]},

        // D scenarios
        { type: 'choice', d: 'D', t: "In a large RPG with character customization, what would you spend the most time adjusting?", options: [
            { v: 1, l: "I never customize, and enter the game with the default preset" }, { v: 2, l: "Casually adjust height and face outline, finishing in a few minutes" },
            { v: 4, l: "Try to create a very refined handsome or beautiful facial proportion" }, { v: 5, l: "Spend a long time polishing tiny details such as eye curvature, eyelashes, skin tone, and lip gloss" } ]},
        { type: 'choice', d: 'D', t: "If invited to a party where cosplay or a costume is required, you would choose:", options: [
            { v: 1, l: "Buy a full-body suit such as Ultraman or Spider-Man just to get by" }, { v: 2, l: "Wear a mask and black trench coat as a mysterious person" },
            { v: 4, l: "Seriously cosplay a cool character I like" }, { v: 5, l: "Feel secretly excited and use the chance to try a very soft, cute, or highly contrasting look" } ]},
        { type: 'choice', d: 'D', t: "When you see an online dance video purely showing cuteness and acting cute, your reaction is:", options: [
            { v: 1, l: "Find it boring or annoying and swipe away immediately" }, { v: 2, l: "Watch the beginning with no expression, then swipe away" },
            { v: 4, l: "The corners of my mouth rise unconsciously, and I think it is indeed cute" }, { v: 5, l: "Smile in front of the screen and even subconsciously imagine what it would be like if I could be that cute too" } ]},
        { type: 'choice', d: 'D', t: "In a social group chat, a friend sends a greeting sticker with a pink filter and an extremely sweet art style. How do you reply?", options: [
            { v: 1, l: "Reply with a question mark \"?\" or a confused reaction meme" }, { v: 2, l: "Reply normally with text like \"morning\" and leave it at that" },
            { v: 4, l: "Casually send an ordinary funny meme" }, { v: 5, l: "Dig through my favorites for an equally soft and cute rolling cat sticker to reply with" } ]},
        { type: 'choice', d: 'D', t: "When shopping online and needing to ask customer service about size, your wording habit is:", options: [
            { v: 1, l: "\"I'm 180 cm, what size\"" }, { v: 2, l: "\"Hello, what size is suitable for someone 180 cm tall?\"" },
            { v: 4, l: "\"Hi, please help recommend a size, thanks~\"" }, { v: 5, l: "\"Ding ding~ Is customer service sister here? Could you help me see which size I should order [pitiful]\"" } ]},
        { type: 'choice', d: 'D', t: "If a guy confesses to you on an anonymous wall because he thinks you are a girl, your inner monologue is:", options: [
            { v: 1, l: "Feel disgusted and want to track him down through the internet" }, { v: 2, l: "Find it funny and immediately post to reveal that I am male" },
            { v: 4, l: "Treat it as social entertainment and screenshot it for friends to laugh at" }, { v: 5, l: "Not only am I not disgusted, I even feel a strange delight that my persona disguise succeeded" } ]},
        { type: 'choice', d: 'D', t: "When you send a message in a group and no one replies, creating an awkward silence, your usual follow-up is:", options: [
            { v: 1, l: "Do not care at all and leave to do something else" }, { v: 2, l: "Send a \"?\" or mention someone to force a question" },
            { v: 4, l: "Feel a little embarrassed and quietly delete the message as if it never happened" }, { v: 5, l: "Send a cute animal sticker that is sweating, awkward, or aggrieved to ease the silence" } ]},
        { type: 'choice', d: 'D', t: "If you could freely choose a title or badge for your personal status on a social app, your first choice would be:", options: [
            { v: 1, l: "Hardcore elements representing power, such as swords, shields, or flames" }, { v: 2, l: "Simple geometric shapes or no badge at all" },
            { v: 4, l: "Neutral and pretty elements such as a small crown, stars, the moon, or clouds" }, { v: 5, l: "A pink bow, small strawberry, heart, or cute paw print" } ]}
    ];

    // =====================================================================
    // Question bank extension layer: fill to 168 questions and normalize metadata for legacy questions
    // =====================================================================
    const supplementalQuestionBank = [
        // --- A: Aesthetics and sensory regulation (new scored questions) ---
        { id: 'A-L22', type: 'likert', d: 'A', facet: 'visual_harmony', scored: true, r: false, face: 1, t: "For everyday objects, I more easily notice whether they coordinate with the surrounding environment when placed on a desk." },
        { id: 'A-L23', type: 'likert', d: 'A', facet: 'texture_comfort', scored: true, r: false, face: 1, t: "If the texture of clothing or bedding is hard, scratchy, or obviously abrasive, it directly affects my mood." },
        { id: 'A-L24', type: 'likert', d: 'A', facet: 'scent_cleanliness', scored: true, r: false, face: 1, t: "I tend to choose wash products, fragrances, or laundry detergents that smell clean and comfortable, rather than looking only at function." },
        { id: 'A-L25', type: 'likert', d: 'A', facet: 'detail_sensitivity', scored: true, r: false, face: 1, t: "When I see layout, colors, or placement that is slightly uncoordinated, I cannot help wanting to adjust it even if it does not affect use." },
        { id: 'A-L26', type: 'likert', d: 'A', facet: 'visual_harmony', scored: true, r: true, face: 1, t: "I almost never care whether things look good together; as long as they work, that is completely enough." },
        { id: 'A-C09', type: 'choice', d: 'A', facet: 'detail_sensitivity', scored: true, r: false, face: 1, t: "When buying a small item you use every day, and several options cost about the same, what would most likely make you order one?", options: [
            { v: 2, l: "Reviews say it is sturdy and durable" }, { v: 4, l: "The size is just right and it does not look out of place on the desk" },
            { v: 1, l: "It is the cheapest; if it breaks, I can replace it" }, { v: 5, l: "The details look pleasing, and holding it makes me happy" } ]},
        { id: 'A-C10', type: 'choice', d: 'A', facet: 'texture_comfort', scored: true, r: false, face: 1, t: "If you were choosing a jacket to wear often at home, you would prioritize:", options: [
            { v: 4, l: "A relaxed but not sloppy fit that feels comfortable to touch" }, { v: 2, l: "Washable and wear-resistant, easy to wear without worry" },
            { v: 5, l: "A sense of being safely wrapped as soon as I put it on" }, { v: 1, l: "Whatever, home clothes do not need attention" } ]},

        // --- B: Body space and movement range (new scored questions) ---
        { id: 'B-L22', type: 'likert', d: 'B', facet: 'space_usage', scored: true, r: false, face: 1, t: "In public spaces, I subconsciously check whether I am blocking others or taking up too much room." },
        { id: 'B-L23', type: 'likert', d: 'B', facet: 'motion_control', scored: true, r: false, face: 1, t: "When picking up or putting down fragile things or things that easily make noise, I usually slow down automatically." },
        { id: 'B-L24', type: 'likert', d: 'B', facet: 'self_grooming', scored: true, r: false, face: 1, t: "Before going out, if I notice my collar, cuffs, or hair is slightly messy, I really want to fix it before leaving." },
        { id: 'B-L25', type: 'likert', d: 'B', facet: 'organization', scored: true, r: false, face: 1, t: "I prefer keeping small personal items in fixed places so I do not have to search awkwardly when I need them." },
        { id: 'B-L26', type: 'likert', d: 'B', facet: 'motion_control', scored: true, r: true, face: 1, t: "My movements are usually large, and I do not really care if I make some noise or mess up the surroundings a little." },
        { id: 'B-C09', type: 'choice', d: 'B', facet: 'space_usage', scored: true, r: false, face: 1, t: "When eating with others at a small table with limited space, you usually:", options: [
            { v: 4, l: "Tuck my things in a bit so everyone can reach the dishes" }, { v: 1, l: "Take care of myself first and put things wherever convenient" },
            { v: 5, l: "Proactively arrange cups, tissues, and tableware to the side" }, { v: 2, l: "Do not handle it specially as long as it is not obviously in the way" } ]},
        { id: 'B-C10', type: 'choice', d: 'B', facet: 'self_grooming', scored: true, r: false, face: 1, t: "Before leaving, you notice your clothes have slight wrinkles. Which reaction is closer to you?", options: [
            { v: 2, l: "Depends; if I am in a hurry, I let it go" }, { v: 5, l: "I find a way to smooth it out or change clothes so I feel comfortable" },
            { v: 1, l: "I do not care at all; others will not stare at it" }, { v: 4, l: "I quickly smooth the obvious parts before going out" } ]},

        // --- C: Emotional response and support preference (new scored questions) ---
        { id: 'C-L21', type: 'likert', d: 'C', facet: 'support_need', scored: true, r: false, face: 1, t: "When under great pressure, I usually need my emotions to stabilize first before I have the energy to handle concrete problems." },
        { id: 'C-L22', type: 'likert', d: 'C', facet: 'empathy', scored: true, r: false, face: 1, t: "When someone describes something that made them feel wronged, I first feel their emotion and then judge the situation itself." },
        { id: 'C-L23', type: 'likert', d: 'C', facet: 'conflict_response', scored: true, r: false, face: 1, t: "After a conflict, even if it seems over on the surface, I repeatedly recall the other person's tone and expression at the time." },
        { id: 'C-L24', type: 'likert', d: 'C', facet: 'support_need', scored: true, r: false, face: 1, t: "When I am negated, compared with immediately receiving a solution, I would rather first be understood and emotionally supported." },
        { id: 'C-L25', type: 'likert', d: 'C', facet: 'empathy', scored: true, r: true, face: 1, t: "I am rarely affected by other people's low moods and can usually quickly separate my feelings from theirs." },
        { id: 'C-L26', type: 'likert', d: 'C', facet: 'conflict_response', scored: true, r: true, face: 1, t: "When an argument happens, I am more used to saying something harsh right away and first suppressing the other person with momentum." },
        { id: 'C-C09', type: 'choice', d: 'C', facet: 'support_need', scored: true, r: false, face: 1, t: "After a project goes wrong and you are already exhausted, what would restore your state the most?", options: [
            { v: 2, l: "Sleep quietly and handle it after waking up" }, { v: 4, l: "Someone helps you sort out the next step" },
            { v: 1, l: "Immediately work overtime and fix it without thinking too much" }, { v: 5, l: "Someone first comforts you seriously and makes you feel not abandoned" } ]},
        { id: 'C-C10', type: 'choice', d: 'C', facet: 'empathy', scored: true, r: false, face: 1, t: "A friend sends a long rant with somewhat messy logic. Your first reaction is more like:", options: [
            { v: 5, l: "First respond to their grievance and let them talk slowly" }, { v: 1, l: "Point out what is unreasonable and tell them not to overthink" },
            { v: 4, l: "Ask clearly what happened, then analyze it with them" }, { v: 2, l: "Read it carefully when I have time" } ]},

        // --- D: Social expression and identity flexibility (new scored questions) ---
        { id: 'D-L21', type: 'likert', d: 'D', facet: 'tone_softening', scored: true, r: false, face: 1, t: "When sending messages, I subconsciously adjust my tone to avoid making the other person feel it is too cold or harsh." },
        { id: 'D-L22', type: 'likert', d: 'D', facet: 'boundary_flex', scored: true, r: false, face: 1, t: "When acquaintances make non-malicious jokes that misread my traits, I usually do not rush to draw a very hard boundary." },
        { id: 'D-L23', type: 'likert', d: 'D', facet: 'online_expression', scored: true, r: false, face: 1, t: "Online, I use relaxed, gentle, or slightly intimate expressions more easily than I do offline." },
        { id: 'D-L24', type: 'likert', d: 'D', facet: 'role_flex', scored: true, r: false, face: 1, t: "If a virtual identity lets me temporarily escape my fixed real-life image, I find it quite interesting." },
        { id: 'D-L25', type: 'likert', d: 'D', facet: 'tone_softening', scored: true, r: true, face: 1, t: "When sending messages, I basically only pursue efficiency; whether the tone is cold or hard is not something I consider." },
        { id: 'D-L26', type: 'likert', d: 'D', facet: 'boundary_flex', scored: true, r: true, face: 1, t: "As long as someone slightly misreads my image, I immediately correct them seriously and cannot leave any ambiguity." },
        { id: 'D-C09', type: 'choice', d: 'D', facet: 'online_expression', scored: true, r: false, face: 1, t: "The group atmosphere is a little cold, and you want to reply with one sentence to soften it. You would more likely choose:", options: [
            { v: 2, l: "Send a normal response so the topic does not break off" }, { v: 5, l: "Use a lighter tone or expression to carry the awkwardness forward" },
            { v: 1, l: "Do not reply; if it gets cold, it gets cold" }, { v: 4, l: "Add a small inoffensive joke" } ]},
        { id: 'D-C10', type: 'choice', d: 'D', facet: 'role_flex', scored: true, r: false, face: 2, t: "When a game allows you to freely design a character's identity and appearance, you usually:", options: [
            { v: 4, l: "Seriously design an image that differs from reality but looks pleasing" }, { v: 1, l: "Use the default directly; being able to play is enough" },
            { v: 5, l: "Enjoy the contrast and freshness brought by switching identities" }, { v: 2, l: "Adjust slightly, as long as it is not too strange" } ]},

        // --- Filler questions: not scored, only dilute intent ---
        { id: 'F-L01', type: 'likert', d: 'F', facet: 'routine', scored: false, r: false, face: 1, t: "I usually roughly plan what I need to complete before the day starts." },
        { id: 'F-L02', type: 'likert', d: 'F', facet: 'routine', scored: false, r: false, face: 1, t: "If a plan is suddenly disrupted, I need a little time to rearrange my rhythm." },
        { id: 'F-L03', type: 'likert', d: 'F', facet: 'information', scored: false, r: false, face: 1, t: "When facing complex information, I like to grasp the structure first, then look at details." },
        { id: 'F-L04', type: 'likert', d: 'F', facet: 'information', scored: false, r: false, face: 1, t: "I more easily remember examples others have mentioned than abstract concepts themselves." },
        { id: 'F-L05', type: 'likert', d: 'F', facet: 'consumption', scored: false, r: false, face: 1, t: "Before buying something, I read a few reviews to confirm whether it truly suits me." },
        { id: 'F-L06', type: 'likert', d: 'F', facet: 'consumption', scored: false, r: false, face: 1, t: "If I will not use something in the short term, I hesitate about buying it even if I like it." },
        { id: 'F-L07', type: 'likert', d: 'F', facet: 'organization', scored: false, r: false, face: 1, t: "I periodically clean up my phone album, downloaded files, or chat cache." },
        { id: 'F-L08', type: 'likert', d: 'F', facet: 'entertainment', scored: false, r: false, face: 1, t: "When entertaining myself online, I often switch between several kinds of content rather than watching only one type." },
        { id: 'F-C01', type: 'choice', d: 'F', facet: 'routine', scored: false, r: false, face: 1, t: "If half a day suddenly opens up on the weekend, you are more likely to:", options: [
            { v: 3, l: "Catch up on sleep or zone out" }, { v: 3, l: "Handle some delayed small tasks" },
            { v: 3, l: "Ask someone out for food" }, { v: 3, l: "Randomly find some content to watch" } ]},
        { id: 'F-C02', type: 'choice', d: 'F', facet: 'information', scored: false, r: false, face: 1, t: "When learning a new tool, you first:", options: [
            { v: 3, l: "Try it hands-on directly" }, { v: 3, l: "Watch a tutorial once" },
            { v: 3, l: "Look for experiences from people who used it before" }, { v: 3, l: "First understand what problem it can solve" } ]},
        { id: 'F-C03', type: 'choice', d: 'F', facet: 'consumption', scored: false, r: false, face: 1, t: "When facing a promotion for similar products, you usually:", options: [
            { v: 3, l: "Check whether I truly need it" }, { v: 3, l: "Compare historical prices" },
            { v: 3, l: "Save it first and decide later" }, { v: 3, l: "Buy it directly if it is useful" } ]},
        { id: 'F-C04', type: 'choice', d: 'F', facet: 'organization', scored: false, r: false, face: 1, t: "When organizing your computer desktop, you are more like:", options: [
            { v: 3, l: "Create folders by project" }, { v: 3, l: "Delete the obviously useless files first" },
            { v: 3, l: "Put everything into a temporary folder first" }, { v: 3, l: "Try not to accumulate things in the first place" } ]},
        { id: 'F-C05', type: 'choice', d: 'F', facet: 'entertainment', scored: false, r: false, face: 1, t: "When you come across a long video, you usually:", options: [
            { v: 3, l: "Read comments first to judge whether it is worth watching" }, { v: 3, l: "Watch key parts at increased speed" },
            { v: 3, l: "Save it to watch later" }, { v: 3, l: "Watch the whole thing if I am interested" } ]},
        { id: 'F-C06', type: 'choice', d: 'F', facet: 'routine', scored: false, r: false, face: 1, t: "When you suddenly need to go out, the first thing you confirm is:", options: [
            { v: 3, l: "Keys and phone" }, { v: 3, l: "Route and time" },
            { v: 3, l: "Weather and traffic" }, { v: 3, l: "Whether I have forgotten anything" } ]},
        { id: 'F-C07', type: 'choice', d: 'F', facet: 'information', scored: false, r: false, face: 1, t: "When someone recommends an app to you, you care more about:", options: [
            { v: 3, l: "Whether it has ads" }, { v: 3, l: "Whether it can improve efficiency" },
            { v: 3, l: "Whether it is easy to get started" }, { v: 3, l: "Whether it takes up space" } ]},
        { id: 'F-C08', type: 'choice', d: 'F', facet: 'entertainment', scored: false, r: false, face: 1, t: "When choosing background music while resting, you more often choose:", options: [
            { v: 3, l: "A familiar playlist" }, { v: 3, l: "Random recommendations" },
            { v: 3, l: "Instrumental music or white noise" }, { v: 3, l: "Currently popular content" } ]},

        // --- Consistency questions: not included in total score, used for stability judgment ---
        { id: 'K-L01', type: 'likert', d: 'K', facet: 'space_usage', scored: false, r: false, face: 1, consistencyKey: 'space', consistencyPolarity: 1, t: "In crowded places, I naturally keep my movements and belongings a little more orderly." },
        { id: 'K-L02', type: 'likert', d: 'K', facet: 'space_usage', scored: false, r: false, face: 1, consistencyKey: 'space', consistencyPolarity: -1, t: "As long as I am not intentionally obstructing others, I do not care much about how much space I occupy in public." },
        { id: 'K-L03', type: 'likert', d: 'K', facet: 'boundary_flex', scored: false, r: false, face: 1, consistencyKey: 'boundary', consistencyPolarity: 1, t: "When acquaintances mildly misread my image, I generally consider the context first rather than immediately fighting back." },
        { id: 'K-L04', type: 'likert', d: 'K', facet: 'boundary_flex', scored: false, r: false, face: 1, consistencyKey: 'boundary', consistencyPolarity: -1, t: "When others make small jokes about my image, I easily become alert and resistant right away." },
        { id: 'K-L05', type: 'likert', d: 'K', facet: 'support_need', scored: false, r: false, face: 1, consistencyKey: 'support', consistencyPolarity: 1, t: "When emotionally frustrated, gentle companionship often helps me recover more than direct reasoning." },
        { id: 'K-L06', type: 'likert', d: 'K', facet: 'support_need', scored: false, r: false, face: 1, consistencyKey: 'support', consistencyPolarity: -1, t: "When I am in a bad mood, I do not need comfort from others; just tell me directly how to solve it." },
        { id: 'K-L07', type: 'likert', d: 'K', facet: 'detail_sensitivity', scored: false, r: false, face: 1, consistencyKey: 'detail', consistencyPolarity: 1, t: "Uncoordinated details attract my attention more easily than I expect." },
        { id: 'K-L08', type: 'likert', d: 'K', facet: 'detail_sensitivity', scored: false, r: false, face: 1, consistencyKey: 'detail', consistencyPolarity: -1, t: "As long as the function is fine, I usually do not care at all whether the details are coordinated." }
    ];

    rawQuestionBank.push(...supplementalQuestionBank);

    const facetByDim = {
        A: ['visual_harmony', 'texture_comfort', 'scent_cleanliness', 'detail_sensitivity'],
        B: ['space_usage', 'motion_control', 'self_grooming', 'organization'],
        C: ['empathy', 'conflict_response', 'support_need', 'emotional_resonance'],
        D: ['tone_softening', 'boundary_flex', 'online_expression', 'role_flex'],
        F: ['filler'],
        K: ['consistency']
    };

    const highFaceHints = [
        'pink', 'cute', 'moe', 'crossdress', 'JK', 'wifey', 'femboy', 'cat', 'bow', 'soft girl',
        'animal', 'healer', 'coquettish', 'spoiled', 'disguise', 'Cosplay', 'VTuber'
    ];

    const dimCounters = {};
    rawQuestionBank.forEach((q, idx) => {
        const dim = q.d || 'F';
        dimCounters[dim] = (dimCounters[dim] || 0) + 1;
        q.id = q.id || `${dim}-${q.type === 'choice' ? 'C' : 'L'}${String(dimCounters[dim]).padStart(2, '0')}`;
        q.facet = q.facet || (facetByDim[dim] ? facetByDim[dim][(dimCounters[dim] - 1) % facetByDim[dim].length] : undefined) || 'general';
        q.scored = q.scored !== false && dim !== 'F' && dim !== 'K';
        q.r = q.r === true;
        q.options = q.type === 'choice' ? q.options : null;

        if (!q.face) {
            const text = `${q.t || ''} ${(q.options || []).map(opt => opt.l).join(' ')}`;
            q.face = highFaceHints.some(hint => text.includes(hint)) ? 3 : 2;
        }
    });

    const legacyChoiceRewrites = {
        'A-C22': { face: 1, t: "A corner of your bedroom has become empty. What kind of experience would you rather add something to improve?", options: [
            { v: 4, l: "A small plant or lamp that makes the room look more layered" }, { v: 1, l: "Leave it empty so temporary items can pile up there later" },
            { v: 5, l: "A comfortable seat or cushion that clearly improves the sense of relaxation" }, { v: 2, l: "A durable storage shelf that is easy to maintain" } ]},
        'A-C23': { face: 1, t: "When choosing an everyday scent for your room, you lean toward:", options: [
            { v: 2, l: "Fresh, low-presence, and unobtrusive" }, { v: 5, l: "Something that smells a little warm and reassuring" },
            { v: 1, l: "As long as it removes odors, the specific smell does not matter" }, { v: 4, l: "Clean and soft, not tiring even after smelling it for a long time" } ]},
        'A-C24': { face: 1, t: "Several headphones have similar sound quality. What is most likely to win you over in the end?", options: [
            { v: 5, l: "The overall proportions and details become more pleasing the longer I look" }, { v: 2, l: "Classic color scheme that is hard to get wrong" },
            { v: 4, l: "Compact, light, and naturally matches daily items" }, { v: 1, l: "Cheap and sturdy, so I will not feel bad if they break" } ]},
        'A-C25': { face: 1, t: "Before going out on a rainy day, what do you care about more when choosing an umbrella?", options: [
            { v: 2, l: "Suitable size and easy storage" }, { v: 4, l: "Color or transparency that makes rainy days feel less gloomy" },
            { v: 1, l: "Thick ribs and large coverage area; nothing else matters" }, { v: 5, l: "Lightweight with pleasing details, so carrying it does not ruin my mood" } ]},
        'A-C26': { face: 1, t: "A friend gives you a set of multicolor markers. How are you more likely to use them?", options: [
            { v: 4, l: "Naturally use colors to distinguish content types while writing" }, { v: 1, l: "Put them in a drawer and think about them later" },
            { v: 5, l: "Arrange commonly used colors and keep the page comfortable while using them" }, { v: 2, l: "Occasionally take one and mark something casually" } ]},
        'A-C27': { face: 1, t: "When buying shampoo, if several options have similar functions, you would prioritize:", options: [
            { v: 1, l: "The one with the most direct, strongest-looking function slogan" }, { v: 4, l: "Packaging that feels fresh and a scent that is not too strong" },
            { v: 2, l: "Large capacity on sale with clear value for money" }, { v: 5, l: "A product whose feel and lingering scent both make me comfortable" } ]},
        'A-C28': { face: 1, t: "When choosing a phone case, which mindset is closer to yours?", options: [
            { v: 4, l: "Thin and light with a little design, but not exaggerated" }, { v: 1, l: "Drop protection first, even if it is thick and heavy" },
            { v: 5, l: "Comfortable to touch, with details that make me want to look at it more" }, { v: 2, l: "Transparent or basic, without affecting the phone itself" } ]},
        'A-C29': { face: 1, t: "When choosing a notebook for daily records, what do you value most?", options: [
            { v: 2, l: "Reasonable price, so I do not feel bad writing casually" }, { v: 5, l: "Paper, opening feel, and cover texture all make me want to use it" },
            { v: 1, l: "Sturdy, thick, and tough enough" }, { v: 4, l: "Clean cover and delicate paper that stays pleasant over time" } ]},

        'B-C22': { face: 1, t: "When facing a jar lid that is hard to open, you are more likely to first:", options: [
            { v: 4, l: "Change the angle or use a cloth, handling it as steadily as possible" }, { v: 1, l: "Twist hard directly and pry with a tool if necessary" },
            { v: 5, l: "After trying a few times, find a more suitable person or method to help" }, { v: 3, l: "Run it under hot water, tap the edge, and slowly try based on experience" } ]},
        'B-C23': { face: 1, t: "On a rest day when the weather turns colder, how do you usually keep warm at home?", options: [
            { v: 2, l: "Normally add a jacket or turn on the AC" }, { v: 5, l: "Change into loungewear that feels comfortable and strongly wrapped" },
            { v: 1, l: "Just endure it for a while and decide when it gets cold" }, { v: 4, l: "Cover my legs with a blanket, which is also convenient for moving around" } ]},
        'B-C24': { face: 1, t: "When drinking a beverage with a straw, which habit appears more often for you?", options: [
            { v: 5, l: "Gently bite or hold the edge and drink slowly" }, { v: 1, l: "Finish it in big gulps without caring much about the action" },
            { v: 4, l: "Gently sip the straw opening with my lips" }, { v: 2, l: "Unconsciously flatten the straw while drinking" } ]},
        'B-C25': { face: 1, t: "When desk cables and small items are messy, you are more likely to:", options: [
            { v: 1, l: "First stuff everything somewhere out of the way" }, { v: 4, l: "Straighten the frequently used items so at least it looks clean" },
            { v: 2, l: "Tie them casually; usable is enough" }, { v: 5, l: "Fix them by category so they are also easy to take later" } ]},
        'B-C26': { face: 1, t: "When several people walk side by side on a sidewalk and someone approaches from the opposite direction, you would:", options: [
            { v: 4, l: "Actively turn sideways or slow down a little so space flows smoothly" }, { v: 2, l: "Slightly adjust my shoulder position" },
            { v: 5, l: "Also tuck in my arms and belongings" }, { v: 1, l: "Keep my original route; the other person can adjust too" } ]},
        'B-C27': { face: 1, t: "A friend tells a very funny story. Your body reaction is more like:", options: [
            { v: 2, l: "Laugh normally without especially controlling movement" }, { v: 5, l: "Laugh happily, but naturally restrain some movements" },
            { v: 1, l: "Laugh freely, possibly slapping the table or my leg" }, { v: 4, l: "Feel happy but with small movements, mainly responding through expression" } ]},
        'B-C28': { face: 1, t: "On public transport, after sitting down next to an empty seat, you usually:", options: [
            { v: 5, l: "Keep my legs, bag, and arms all within my own space" }, { v: 1, l: "Sit however comfortable and do not care much about posture" },
            { v: 2, l: "Sit naturally without deliberately adjusting" }, { v: 4, l: "Pay attention not to touch nearby people or things" } ]},
        'B-C29': { face: 1, t: "When eating food that easily drops crumbs or stains your hands, you would:", options: [
            { v: 2, l: "Eat normally and wipe later if it gets dirty" }, { v: 4, l: "Press it slightly or adjust the angle to make less mess" },
            { v: 1, l: "Take big bites directly; convenience matters most" }, { v: 5, l: "Prepare tissues or shield with my hand to avoid getting dirty" } ]},

        'C-C21': { face: 1, t: "When hearing music with strong emotion but no lyrics, you are more likely to:", options: [
            { v: 4, l: "Think of past moments and have my mood pulled along a little" }, { v: 1, l: "Feel nothing much; it is just background sound" },
            { v: 5, l: "My body slows down too, and I want to stay quiet for a while" }, { v: 2, l: "Notice what scene or video it would suit" } ]},
        'C-C22': { face: 1, t: "When your small mistake affects a friend's plan and their tone is bad, you would:", options: [
            { v: 2, l: "Hold down my emotions and first explain the reason and remedy" }, { v: 5, l: "Be strongly affected by their tone and need to recover for a moment" },
            { v: 1, l: "Think they are overreacting and easily push back" }, { v: 4, l: "Apologize seriously and quickly take responsibility for my part" } ]},
        'C-C23': { face: 1, t: "When you encounter a small animal on the road that looks like it needs help, you usually:", options: [
            { v: 4, l: "Stop and watch for a while, judging whether I can help safely" }, { v: 2, l: "Feel it is pitiful, but leave first if I am in a hurry" },
            { v: 5, l: "Feel easily moved and want to do something immediately" }, { v: 1, l: "Not be affected much and continue my own route" } ]},
        'C-C24': { face: 1, t: "When pressure is so high that you can barely hold on, you need more:", options: [
            { v: 1, l: "Immediately do something highly stimulating to release emotions" }, { v: 4, l: "Find someone I trust and explain everything clearly" },
            { v: 2, l: "Sleep alone and temporarily avoid communication" }, { v: 5, l: "First be comforted and emotionally held, then slowly handle the problem" } ]},
        'C-C25': { face: 1, t: "When seeing a stranger's difficult story, your more common reaction is:", options: [
            { v: 2, l: "Sigh a little, but not linger too long" }, { v: 5, l: "Strongly relate to it, and the emotion lasts for a while" },
            { v: 1, l: "Keep distance and first judge whether the information is true" }, { v: 4, l: "Feel heavy and want to leave comfort or support" } ]},
        'C-C26': { face: 1, t: "When group-task distribution is clearly heavier on your side, you would:", options: [
            { v: 4, l: "Start doing it while looking for a chance to communicate and adjust" }, { v: 1, l: "Strongly refuse on the spot; I cannot be taken advantage of" },
            { v: 5, l: "Not dare refuse face to face, then digest the grievance alone afterward" }, { v: 3, l: "Organize reasons and request redistribution" } ]},
        'C-C27': { face: 1, t: "When getting along with a very reliable and capable close person, the mode you find more comfortable is:", options: [
            { v: 2, l: "Both independent, respecting each other's boundaries" }, { v: 5, l: "Being able to rely on them with peace of mind and occasionally let down my guard" },
            { v: 1, l: "Must compete equally and not appear weak" }, { v: 4, l: "Let the other person make some decisions while I cooperate" } ]},
        'C-C28': { face: 1, t: "When a horror movie or game suddenly scares you, you are more likely to:", options: [
            { v: 5, l: "Visibly shrink back and want to grab something nearby" }, { v: 2, l: "Freeze for a moment, then keep watching" },
            { v: 4, l: "Close my eyes or cover the screen and continue after calming down" }, { v: 1, l: "Curse or get angry, using aggression to suppress fear" } ]},

        'D-C21': { face: 1, t: "When a game allows free character appearance design, you usually spend time on:", options: [
            { v: 4, l: "Whether the overall proportions and style are coordinated" }, { v: 1, l: "Default preset, enter the game as soon as possible" },
            { v: 5, l: "Tiny adjustments to facial features, skin tone, and detail texture" }, { v: 2, l: "Simply adjust outline and height" } ]},
        'D-C22': { face: 2, t: "When attending a party that requires a themed look, you are more likely to choose:", options: [
            { v: 2, l: "Simple props plus basic clothing to meet the requirement" }, { v: 5, l: "Try a complete image very different from usual" },
            { v: 1, l: "Something that can cover myself and is as easy as possible" }, { v: 4, l: "Seriously recreate the style of a character I like" } ]},
        'D-C23': { face: 1, t: "When you come across a video with a relaxed style and outgoing expression, you would:", options: [
            { v: 4, l: "Think the atmosphere is nice and may watch it to the end" }, { v: 1, l: "Think it is boring and swipe away immediately" },
            { v: 5, l: "Be infected by it and even imagine expressing myself in a different way" }, { v: 2, l: "Watch a few seconds to judge whether it is content I like" } ]},
        'D-C24': { face: 1, t: "Someone in the group sends a very enthusiastic greeting. How would you respond?", options: [
            { v: 5, l: "Respond in an equally relaxed and close way" }, { v: 2, l: "Reply with a normal sentence of text" },
            { v: 4, l: "Add a small inoffensive expression or joke" }, { v: 1, l: "Reply very briefly to avoid being pulled into the atmosphere" } ]},
        'D-C25': { face: 1, t: "When consulting online customer service, your expression style is more like:", options: [
            { v: 2, l: "Politely explain the need and ask clearly about size" }, { v: 5, l: "Use a softer tone, hoping the communication goes smoothly" },
            { v: 1, l: "Send only key information, as short as possible" }, { v: 4, l: "Add phrases like thanks or sorry to bother you to soften the tone" } ]},
        'D-C26': { face: 1, t: "In an anonymous setting, when someone misjudges your identity or temperament, your first reaction is:", options: [
            { v: 4, l: "Treat it as a small social episode and not rush to interrupt" }, { v: 1, l: "Feel strongly uncomfortable and correct it immediately" },
            { v: 5, l: "Find it a bit novel and want to see how the misunderstanding develops" }, { v: 2, l: "Find it funny, but explain at the right time" } ]},
        'D-C27': { face: 1, t: "After you send a message in a group and the chat goes cold, you usually:", options: [
            { v: 2, l: "Wait a bit and not force a rescue" }, { v: 5, l: "Use a light tone or expression to move past the awkwardness" },
            { v: 1, l: "Ignore it completely and leave to do something else" }, { v: 4, l: "Add a self-deprecating sentence or delete the message to reduce embarrassment" } ]},
        'D-C28': { face: 1, t: "If a social app lets you choose a personal status charm, you would lean toward:", options: [
            { v: 4, l: "Light decorations such as stars, clouds, or the moon" }, { v: 1, l: "Elements with obvious strength or competitive feeling" },
            { v: 5, l: "Small, approachable elements that make the page feel softer" }, { v: 2, l: "Geometric shapes or simply no charm" } ]}
    };

    rawQuestionBank.forEach(q => {
        const rewrite = legacyChoiceRewrites[q.id];
        if (!rewrite) return;
        Object.assign(q, rewrite);
    });

    const legacyLikertRewrites = {
        'A-L02': { face: 1, t: "When buying everyday items, if the shape and feel are more pleasing, I am more inclined to choose them even if the practicality is about the same." },
        'A-L13': { face: 1, t: "[Reverse] If a home color scheme is clearly soft, I feel it does not fit me at all and may even affect my mood when using it." },
        'D-L01': { face: 1, t: "In online social interactions, I habitually use symbols or expressions that are not too stiff to soften my tone or express friendliness." },
        'D-L05': { face: 1, t: "[Reverse] If someone calls me by a relatively close or casual nickname, I become obviously uncomfortable and immediately ask them to change it." },
        'D-L06': { face: 1, t: "In front of close friends I know well, I can accept them making harmless jokes around my personality or temperament." },
        'D-L07': { face: 1, t: "If others describe me with words like approachable or easy to get close to, I usually do not feel offended." },
        'D-L08': { face: 1, t: "When choosing an online avatar, I more often use pictures with a gentle style, recognizable character, or emotional expression rather than purely functional images." },
        'D-L09': { face: 1, t: "[Reverse] I almost never use emotional or stylized reaction images on social platforms because I think they are immature." },
        'D-L10': { face: 1, t: "When chatting with very close friends, I occasionally lighten my tone on purpose to liven the mood or express closeness." },
        'D-L12': { face: 1, t: "When watching films, shows, or animation, I sometimes enjoy slow-paced daily content with a stable atmosphere more than intense conflict and stimulation." },
        'D-L14': { face: 1, t: "My commonly used reactions or quick replies usually include some content for expressing awkwardness, grievance, or softening the atmosphere." },
        'D-L15': { face: 1, t: "In multiplayer games or team activities, I sometimes enjoy positions that provide support, maintain rhythm, or look after teammates' states." },
        'D-L18': { face: 1, t: "In anonymous group chats, compared with always leading the topic, I prefer being the person who occasionally joins in and softens the atmosphere." }
    };

    rawQuestionBank.forEach(q => {
        const rewrite = legacyLikertRewrites[q.id];
        if (!rewrite) return;
        Object.assign(q, rewrite);
    });

    window.rawQuestionBank = rawQuestionBank;
})();
