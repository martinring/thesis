# Timing of [Self-Verification]{.nobr}

> *This chapter is based on the original work "Let's Prove it Later --- Verification at Different Points in Time" [@Timing]*

In this chapter, we investigate the effects of self-verification on 
the development. That is, we want to explore *when* to prove properties and 
which ones, and we want to investigate how self-verification interacts with the 
development process. For this, we introduce a more abstract view on 
self-verification and widen the somewhat simplistic concept of *configurations* 
to *trigger transitions*: Transitions of a system that trigger a verification 
(i.e. in terms of [#chap:selfie], a change of the configuration). 

## [Design Time]{.nobr} vs. [Self-Verification]{.nobr} vs. [Runtime Verification]{.nobr}

The key advantage of self-verification as described in [#chap:selfie] is that 
after deployment, the concrete values of parameters may become known for 
verification. Some may be instantiated early on after deployment, and not change
after that at all, or only very infrequently; others may change, but not that
often; and even others may be sensor data which are read in small
intervals, but where the rate of change may be limited. All of this
information may be utilized at runtime for more efficient verification.

This observation hinges on the fact that proving a property $\phi$ depends, 
*inter alia*, on the number of free variables in $\phi$, and that parameters as 
mentioned above usually occur as free (or universally quantified) variables in
$\phi$. Then, proving $\phi\Subst t x$ with a ground term $t$ instantiated for 
$x$ is typically orders of magnitude easier than proving $\phi$.


![Four different points in time chosen for verification, from design time 
(leftmost) to runtime (rightmost). Trigger transitions are marked with small 
boxes; they trigger verification tasks which show that every possible path 
through the state space which does not include other trigger transitions is 
safe. Green boxes mark successful verification, and red boxes mark failed 
verification tasks. The solid red state is unsafe; it violates the safety 
property $\phi$. Grayed-out states are not reachable, because they come after a 
failed verification (open red box). Design time verification (on the left) would 
identify the system as erroneous and prohibit its execution. Second to left, the 
system is verified early after deployment and thus is allowed to execute only a 
small fraction (6 transitions) of the system, blocking two transitions and 
leaving 6 transitions unreachable. Third to left, most of the system is 
executable (11 transitions) but two transitions are blocked and one transition 
is not reachable. The rightmost example allows all but one transition. Note that 
in the last example the system gets deadlocked in state 4 when taking the 
leftmost path.](traces1.svg;traces2.svg;traces3.svg;traces4.svg){#fig:configuration}

Comparing self-verification to runtime and *a priori* design time 
verification on a more abstract level, we consider specific runs of the system
$\langle\sigma_i\rangle_{i\in\Nat}$, consisting of states $\sigma_i$, and a
safety property $\phi$. Usual design time verification proves the
general property that for all runs, $\forall i.\,\phi(\sigma_i)$, i.e. the
safety property holds for all states. In OCL and related formalisms, this
is achieved by an inductive argument, showing that we start in a safe state, 
$\phi(\sigma_0)$, and that from a safe state we can only get to a safe state, 
$\phi(\sigma_i)$ implies $\phi(\sigma_{i+1})$.

Runtime verification, on the other hand, considers whether a specific run
satisfies $\forall i.\,\phi(\sigma_i)$ and does not restrict the transitions
of the system; unsafe states can be reached, but this is always detected.

In self-verification, instead of restricting transitions, we classify them
into trigger transitions and ordinary transitions. The idea is that when
the system goes through a trigger transition $\sigma_i\rightarrow\sigma_{i+1}$, 
self-verification shows that all states $\sigma_k$ reachable with ordinary 
transitions from $\sigma_{i+1}$ are safe, i.e. $\phi(\sigma_k)$. If another 
trigger transition is reached, the self-verification is run again. Note that the 
classification of trigger transitions and ordinary transitions depends on the 
particular $\phi$, and is a design decision (see [#sec:case-study] 
below). *A priori* and runtime verification can be seen as extreme cases of
self-verification: in design time verification only one transition
(the one leading to the initial state of the system) is classified as a
trigger transition, while in runtime verification every transition is a
trigger transition.  [#fig:configuration] illustrates the effect
of different sets of trigger transitions for one system.

Because the effort to state and prove $\phi$ increases with the number of states
we want to cover, self-verification allows us to strike a balance: we may
prove $\phi$ with little effort for a small number of states, and so have to
reprove it more often, or we may prove $\phi$ for more states, but with
more effort. 

When we specify the desired behaviour of the system with design time
verification, we need to state the required preconditions very precisely ---
they need to be strong enough to be able to actually show that the system
globally satisfies the specified properties, and to preclude unwanted
behaviour, but weak enough to still allow all desired
implementation. If we move verification into runtime, we can relax
preconditions at design time, allowing for more readable specifications and
speeding up the development process. Consider
[#fig:configuration] again: to make the system usable as
well as correct, one would have to, e.g. refine the specification (or the
implementation) to exclude the transitions from states 1 and 2 to 3. With
self-verification, we can allow a more liberal specification or
implementation and still remain safe, making the development process easier.

Thus, in essence specification becomes easier and faster to write, and
moreover we are liberated from having to prove everything *a priori*,
and can instead adapt the proving strategy to the problem at hand. 

## Case Study {#sec:case-study}

In the following, we introduce a case study building loosely on Abrial 
[@Abrial]. The case study is simple enough to be easily understood, yet complex 
enough to show the subtle effects of verification at different points in time. 

### Informal Description

To motivate our case study, think of a building where fine-grained access
control is needed for security or safety reasons, e.g. a nuclear power
plant, but which also needs to be able to be evacuated very fast in the
case of an emergency. In that case, we want to be able to eliminate access
control (to allow fast evacuation) and just open some of the doors in such
a way that all users are able to get out, but no user gains access to a
room where they are not allowed to enter.

More precisely, we have a *building* consisting of several
*rooms*. The rooms are connected by *doors*, which are
unidirectional (think of turnstiles; normal two-way doors are an obvious
generalization). Thus, doors lead from one room to another one, which is
equivalent to each room having a set of entries and exits.

Users are represented in the system by *cards* which regulate the
access to rooms. (In the following, we use cards and users interchangeably;
the formal specification only has cards.) Each card authorizes access to a
set of rooms, by restricting passage through the doors. The access control
system operates in two modes: in normal mode, a door may only be passed
(using a card) if the card authorizes access to the room the door is
leading to. However, we can declare an emergency for the whole building; in
that modus, some doors are opened, allowing anyone to pass through.

Opening doors in an emergency is subject to two *safety properties*:
firstly, it should allow any user (card) to eventually arrive in a safe
room, and secondly, it should not allow any user to enter a room they are
not authorized to. A subset of rooms is considered to be *safe*; in
the simplest case, this can just be the outside modelled as a
room. 

As an example for the necessity of the safety properties, take the nuclear
power plant: even in case of an emergency, one would not want 
anybody to exit through the reactor core.

![Example of a very simple building. The user with card A is
authorized for room a, user B is authorized for room b, both are
authorized for rooms c and s. Room s is the only safe room (it is
the outside). The situation shown violates the
safety property.](simple-building.svg){#fig:simple-unsafe width=50%}

This rather innocuous specification allows some subtle effects. Consider the 
simple building in [#fig:simple-unsafe]; the depicted situation violates the
safety property, as in case of an emergency, we cannot disable access control 
and open the doors in such a fashion that neither user A or user B are allowed 
to access rooms they are not authorized to (rooms b and a, respectively), and 
both are able to get to a safe room (s). 

Hence, we need to prevent a situation like this from happening. This
could be done by

- either restricting the layout of the building in such a way that
  situations like this do not happen (this is what is usually done,
  with layouts were corridors are the default escape route, and users
  do not have to traverse long sequences of rooms);
- or by restricting the authorizations of the cards in such a way
  that a situation like above does not happen;
- or by checking that \emph{before} a users enters a room no
  situation violating the safety property like above is created.

### Formal Specification

![Formal specification of an access control system.](formal.svg){#fig:spec}

We can now give a formal specification of our access control
system. We will use the subset of SysML and OCL introduced in [#chap:specific], 
where block definition diagrams model the structure of the system, and OCL 
constrains the dynamic behaviour.

In [#fig:spec], we can see blocks modelling the building,
doors, rooms and cards respectively. The building has a Boolean
attribute *emergency*. A door leads from exactly one to another
room, but a room may have many (or no) entries and exits. A door may only 
connect rooms which are part of the same building:

````{.ocl .continue}
context Door
  inv: from.building = to.building
````

Furthermore cards are also associated to buildings and may only authorize 
access to rooms which belong to the same building:

````{.ocl .continue}
context Card
  inv: authorizations->forall(r| r.building = self.building)
````

Cards have a set of *authorizations* (rooms which the holder of the
card is allowed to enter) and exactly one *location*, which
determines the current location of the card, and which must always be
contained in the set of authorizations. ^[We assume an idealized scenario where 
we can reliably track the location of a card holder and can prevent that people 
share their cards]. On the other hand, rooms have a set of *authorized* cards (those
cards which have the room in their set of authorizations), and a set of
*checkedIn* cards (the set of cards whose location is this room).

````{.ocl .continue}
context Room
  inv: checkedIn->forall(p | authorized->contains(p))
````

````{.ocl .continue}
 context Card
  inv: location->forall(r | authorizations->contains(r))
````

Rooms have a Boolean attribute *isSafe* which determines whether the
room is safe during an emergency. A door has a method *pass*, which
determines whether a given card is allowed to pass. This is the case if
either the door is open (see immediately below), or if the card is in the
room this door is opening from, and the card is authorized for the room the
door is opening to. We have encapsulated this precondition as an OCL
function *mayPass* in order to reuse it later. The postcondition of
the *pass* method is that the *location* of the card has
changed to the room the door is opening to. Doors are only allowed to be opened
in case of an emergency.

````{.ocl .continue}
context Door
  def: mayPass(card: Card): Boolean = 
    isOpen or from.building.emergency
    and card.authorizations->contains(to)
  inv: isOpen implies from.building.emergency
````

````{.ocl .continue}
context Door::pass(card: Card):   
  pre: mayPass(card) and card.location = from
  post: card.location = to
````

We now want to formalize the safety property: in an emergency, users can always
reach a safe room, yet no user has access to a room they are not authorized
to. To formalize a user being able to reach a room, we formalize the notion
of recursive *access*, which models the traversal along a sequence of
connected rooms: users have access to the room they are currently in, and
recursively to all rooms which can be reached through doors which may be
passed (i.e. rooms which have an entry from an accessable room that this card
has access to). We formulate this notion as an OCL function
*hasAccess* which for a given room determines whether a given card
has access to this room. Since OCL does not allow non-terminating functions we 
pass the set of already traversed rooms to the helper function *hasAccess$*
such that we do not traverse cycles:

````{.ocl .continue}
context Room
  def: hasAccess(card: Card): Boolean = hasAccess$(card,Set{})
  def: hasAccess$(card: Card, visited: Set(Room)): Boolean = 
    card.location = self or
    visited.excludes(self) and entries->exists(e | 
      e.mayPass(card) and 
      e.from.hasAccess$(card, visited->including(self)))
````

We can now specify the safety properties: firstly, that users can
always reach a safe room, and secondly, that users only have access to
rooms they are authorized for:

````{.ocl .continue}
context Card:
  inv safe1: building.rooms->exists(r | 
    r.isSafe and r.hasAccess(self))
  inv safe2: building.rooms->forall(r | 
    not r.authorized->contains(self) implies not r.hasAccess(self)))
````

### When to Verify

![Situations which are safe. On the left, user B cannot enter room c 
until user A has left. On the right, a similar situation, but the user B may 
have taken the long path through room e and d quite unnecessarily before not 
being able to proceed further.](building-1.svg;building-2.svg){#fig:simple-safe}

In order to preclude an unsafe situation as in
[#fig:simple-unsafe], we have to show our system satisfies the
safety property. Of course, in full generality --- universally quantified
over all buildings and all authorizations --- the safety property does not
hold; we can easily find counterexamples (such as
[#fig:simple-unsafe]). If we want to show the safety property at
design time, we have to formalize conditions which are sufficient for the
safety property (\ie preclude unsafe buildings).

With self-verification, we can show the safety property after deployment,
at different points in time:

a) right after deployment to a specific building, for all possible
   cards, authorizations and allocations of users to rooms; or {#enum-verify-1}
b) after authorization has changed, for a specific building, but for
   all possible allocations of users to rooms; or {#enum-verify-2}
c) when a user requests access to a different room: if the new
   configuration of the user in this different room is unsafe, access is
  not granted.{#enum-verify-3}

In case [#enum-verify-1], we would either need an explicit and
sufficient characterization of "every user always has a safe exit route",
or we need to search a lot of instances (all paths for all users from all
rooms). For most buildings, we will be able to find counterexamples of
unsafe configurations of users and access rights, but we may be able to
restrict access rights in such a way that we can prove the safety
property. If we can prove the safety property at this point, we are done,
but this may not always be possible.

The other extreme case is [#enum-verify-3]; this is fairly
straightforward to verify, but might be inconvenient to the user. (Thus,
this is an example of making a system safe by restricting its
availability.) Consider the situation in [#fig:simple-safe] with
the same authorizations as in [#fig:simple-unsafe]. On the left,
user B cannot enter room c until user A has left, because otherwise we
would have the situation from [#fig:simple-unsafe] which is not
safe. This might result in situations like on the right of
[#fig:simple-safe], where user B might take a long tour through
room e to room d only to find they cannot proceed any further. 

A good compromise is case [#enum-verify-2]: we verify the safety
property each time the authorizations change, for a specific building and
specific authorizations. In most cases, this should be reasonably efficient ---
the search space is through all possible allocations of users to rooms ---
but still precludes unsafe allocations.

Note how self-verification allows us to relax the development process:
because we can prove the safety property at runtime, we do not need to
specify all its preconditions at design time (here, we do not need to
characterize the preconditions to make buildings and authorizations
safe). This makes the development process more *agile* without
compromising safety.

## Realization {#sec:timing-implementation}

### Applying the Design-Flow for Self-Verification

````{.sysml #fig:example-bdd caption="Textual representation of the SysML block definition diagram"}
bdd [package] selfie::acs [ACS]
-------------------------------

block Building
  references
    rooms: Room[*] <- building
    cards: Card[*] <- building
  values
    emergency: Boolean

block Door
  references
    from: Room[1] <- exits
    to: Room[1] <- entries
  values
    isOpen: Boolean
  operations
    pass(card: Card)
      pre: mayPass(card) and card.location = from
      post: card.location = to  
  constraints
    def: mayPass(card: Card): Boolean = 
           if from.building.emergency
           then isOpen 
           else card.authorizations->contains(to)
    inv: from.building = to.building
    inv: isOpen implies from.building.emergency

block Card
  references
    authorizations: Room[*] <- authorized
    location: Room[1] { subsets authorizations } <- checkedIn 
    building: Building[1] <- cards
  constraints
    inv: authorizations->forall(r | r.building = self.building)
    inv: building.rooms->forall(r | not r.authorized->contains(self) 
                                    implies not r.hasAccess(self)))
    inv: building.rooms->exists(r | r.isSafe and r.hasAccess(self))

block Room
  references
    building: Building[1] <- rooms
    exits: Door[*] <- from
    entries: Door[*] <- to
    authorized: Card[*] <- authorizations
    checkedIn: Card[*] { subsets authorized } <- location 
  values
    isSafe: Boolean  
  constraints
    def: hasAccess(card: Card): Boolean = 
           card.location = self or entries->exists(e | 
             e.mayPass(card) and e.from.hasAccess(card))    
````

We apply the desgin flow introduced in [#chap:selfie] to our case study. As 
demonstrated in [#sec:case-study], we use the same subset of SysML (block 
definition diagrams and state machine diagrams^[The case study only uses block 
definition diagrams.]) together with OCL as a specification formalism. Block 
definition diagrams and state machine diagrams can be given a formal semantics 
(which is not the case for all SysML diagrams), so our specifications have a 
mathematically well-defined, formal meaning. This is indispensable if we want 
to perform formal correctness proofs.

We use our textual representation of block definition diagrams and
state machine diagrams. [#fig:example-bdd] shows an excerpt; parts of
the corresponding OCL specifications have been shown in
Section [#sec:case-study] above. 

The implementation is given as an executable *system model*. To stay
independent of a specific programming language, we again use the functional
hardware description language Clash [@ClaSH] as modelling language,
since it allows us to simulate the system as well as synthesize an
implementation in VHDL or VeriLog. Another possibility with more
commercial traction would be SystemC, but that has a less clear semantics
and it is embedded in C++, technically a lot more awkward to handle (in
Clash, adding proof support was merely a question of adding an additional
backend; in SystemC, we do not even have an explicit representation of the
model to start from).

Our tool chain reads the SysML and OCL specification, performs the
appropriate type checks, reads the Clash model, and generates the
corresponding first-order proof obligations in bitvector format
(first-order logic with limited width integers as datatypes). The proof
obligations are essentially obtained by taking a representation of the
system model in bitvector logic, and showing they satisfy the OCL constraints
(pre/postconditions and invariants). They can be
either processed at design time by an SMT prover such as Yices or Z3, or
transferred to runtime. Proving at runtime is either performed by an SMT
prover running on the target system, if the latter is powerful enough, or by
converting the proof obligations into conjunctive normal form (e.g. using
the Yices prover) before transferring it to the target system, and using a SAT 
solver at runtime (either as a lightweight software SAT solver
[@light-weight-SAT-solving] or even a hardware SAT solver [@hardware-SAT-solving])

### The Demonstrator

![Design flow adapted to our demonstrator.](design-flow-demonstrator.svg){#fig:design-flow-demonstrator}

If we implement the case study in our usual design flow, we derive a
hardware implementation, e.g. on an FPGA. In order to explore the
implications of proving at different points in time, and to demonstrate the
effects of self-verification in an easily accessible setting, 
we implemented the case study as an interactive demonstrator. For this, we leveraged
the two previously developed tool flows for the instantiation of our model from 
[#chap:specific] as well as self-verification in [#chap:selfie].
This allows us to semi-automatically translate the above SysML defenition 
into an executable system by generating implementation stubs as well as translating 
the model into a an refinable SMT instance. 

Simulating the hardware turned out to be very slow, so instead we chose to
adapt our flow: the implementation is an interactive SVG, with the dynamic 
behaviour implemented in TypeScript. 

The core of the system is generated as implementation stubs, using an
adapted form of our design flow (see [#fig:design-flow-demonstrator]).

We have chosen TypeScript [@TypeScript] as the target language
(TypeScript is like JavaScript, but with added type security),
because it allows us to dynamically modify the abstract syntax tree (the DOM) of
the SVG. This allows the demonstrator to be displayed and run on any recent
web browser. In addition to the specified behaviour we manually implemented
means to add and remove cards and change their access rights, and 
reading building topologies from a non-interactive SVG. We have implemented
access cards (and implicitly their owners) as automated agents which
randomly roam the building. This allows us to observe the implications of
the different points in time of the verification; for example, the
behaviours mentioned for case [#enum-verify-3] in
[#sec:case-study] above manifest themselves in agents hovering
in one place unable to proceed because of the violation of the safety
property this would incur.

The generated SMT proof obligations are a general equivalence proof which
can be processed by an SMT prover at design time. As mentioned above, the
prover quickly finds counter examples since our specification can easily
be violated in general. By adding runtime information in the form of
assertions, we refine the instance on the fly. This was realized by
establishing a WebSocket connection between the SVG and the Z3
prover. For this, we use the \textit{websocat} utility, which wraps a
WebSocket server around a command-line program. This allows us to
load the general proof and then incrementally send assertions restricting
the state space.

\begin{figure}[t]
  \centering
  \includegraphics[width=\linewidth]{images/screenshot}
  \caption{The demonstrator is implemented as an interactive SVG document,
    displayed here in a web browser.}
  \label{fig:screenshot}
\end{figure}

Technically, the arbitrarily mutable state of our simulation is in
principle not compatible with the monotonous nature of adding assertions:
assertions can only add information but not change or remove. Fortunately,
SMT-LIB (the common language used by most SMT provers) allows us to use
scopes (with the commands *push* and *pop*) for this. In
order for this to work, we introduce a fixed order in which information is
added, which is based on the order of execution in the system, ideally
corresponding to the frequency of change. First we add the general building
topology, then the access rights, and after that, the tracked locations of
the card holders. Between every assertion, we save the current size of the
assertion stack with the *push* command. If any information changes,
we remove the assertion with the now outdated information as well as any
assertion which came afterwards. Then we only need to add the updated
assertions. Depending on the point in time chosen, we can check
satisfiability anywhere between.

An interesting feature of our implementation is that we did not implement any 
algorithm which opens the doors. Instead, we use the prover to give us a
model of the existentially quantified safety property, which states that 
there must be a safe way to exit (i.e. a set of doors to open in case of 
emergency). Through self-verification not only did we not have to characterize 
buildings, access rights or safe paths through the building, we
even did not have to implement a path finding algorithm at all.

The demonstrator is shown in Figure \ref{fig:screenshot}. It connects the
implementation to the proof engine running the SMT instance. We can
manually choose one of the three different information levels for the proof,
which result in different assertions being added as well as different
triggers for the proof.

Users can explore the consequences of the different points in time for the
self-verification. For example, if they choose to verify early on (after a
new card has been added or access rights change) and add a
lot of cards, they will notice a considerable slow-down when adding new
cards or changing access rights. If they choose to verify late (before a
user enters a room), and construct situations like in
[#fig:simple-safe], they will realize how users congregate in
front of a room unable to get in. (The demonstrator is intended to be used
together with additional interactive explanation, not stand-alone, as
situations like this will have to be constructed consciously.)

The source code of the demonstrator is publicly available on
GitHub.^[[https://github.com/DFKI-CPS/selfie-demo](https://github.com/DFKI-CPS/selfie-demo)]

## When to Prove

The focus of the case study has been to investigate the implications and
consequences of the point in time at which the proof of safety properties
take place at runtime.

Generally, the earlier we can prove, the more
general the proven safety property, but the larger the search space is and
subsequently the longer it will take. How to pick the right points in time
depends on the actual system and is very much a design decision.

However, we have made a number of observations which can help to assist in
finding the right set of trigger transitions. The set of trigger
transitions should be large enough such that verification tasks can be
completed in a timely manner (again, acceptable verification times depend on
the concrete use case), but reduced in a way such that no critical
transition is included. Trigger transitions might be prohibited by
self-verification in case the specification is violated (fails to verify in
the concrete instance), so critical transitions should not be included in
the set of trigger transitions: e.g. if we verify the existence of an
escape route in case of an emergency it is clearly too late to handle
failure.  On the other hand administrative operations like changing access
rights are far better suited to be included as trigger transitions, since a
potential failure is presented to a trained user of the system. Lastly, one
should avoid transient states (e.g. a user is
inside a security gate) which can only be left through trigger transitions since 
self-verification may lead to a system dead-locked there, as in [#fig:configuration].

## Conclusions

The vehicle of our investigations in this chapter was a case study consisting 
of an access control system, which is parameterized in many dimensions (the 
building under control, the access rights, the users) that can be instantiated 
at different points in time. 

In order to make our results concrete and tangible, we have developed a
demonstrator --- the access control system implemented as an interactive
SVG, which can be viewed and run in any web browser. Users can directly
experience the effect of choosing different verification triggers.

The demonstrator also exhibits the general applicability of
self-verification and the versatility of our tool chain, which could be
adapted to support a different implementation platform (SVG and TypeScript
instead of Clash) with moderate effort.

In [#chap:partitioning], we will further investigate how the designer can 
be assisted in the design decisions; in particular, how the system can suggest
which variables offer the most reduction in proof time when instantiated.
