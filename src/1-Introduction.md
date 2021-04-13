# Introduction

Contemporary embedded and cyber-physical systems have become so commonplace
that we, almost unconsciously, rely on their correct functioning --- we
just expect our smartphone to work. This is contrary to the fact that
these systems have reached a complexity where the verification of their correct 
behaviour becomes prohibitively expensive. In the past decades, the verification 
of embedded and cyber-physical systems has become a pressing, complex and 
elaborate problem for which a number of high-end tools are available 
[@Simulation;@Wille2009;@Clarke:2000;@DBLP:conf/ddecs/KoczorMPP16]. Designers and 
verification engineers have access to an enormous amount of computational power, 
e.g. in terms of high-end design and compute servers. However, time-to-market
constraints are putting increasing pressure on releasing products earlier
and, hence, a full correctness proof is only ever done for the most 
safety-critical systems. For all other devices, errors during the design process 
may remain undetected in the final product.

This is obviously caused by the exponential complexity of the problem. Each 
year, more complex systems are being designed and need to be verified. Iterative 
improvements have been proposed in the past years, e.g. the introduction of 
higher levels of abstractions for design such as the *Formal Specification Level* 
[@DSW:12] and the *Electronic System Level* [@MBP:07], or the lifting of SAT 
solvers to solvers for *SAT Modulo Theory* (SMT) [@ES:2003;@BBC+:2005;@Wille2007SWORDAS;@Dutertre:2014;@Moura2008Z3AE], but these cannot and will not be able to cope
with the complexity. The consequences are evident today: While several
years back, the actual implementation process was the core activity in any
design flow, verification dominates today. In fact, more than 40% of the
time and costs within the design are devoted to prove the correctness of a
system [@Foster:13].

Because of this situation, we are convinced that verification cannot solely be 
addressed by incremental improvements of existing approaches anymore, but rather 
a shift in the existing verification paradigm. In this thesis, we are proposing 
a methodology towards such a paradigm shift. 

Current verification techniques such as theorem proving, model checking,
static analysis or testing are conducted at design time and finished before deployment,
for two reasons: firstly, we want to make sure the system has no errors
before putting it into operation, and secondly, it is not entirely clear
how to conduct verification at runtime. But this approach has the drawback that the
time for verification is limited; errors which are not caught by the time
the system is going into operation will remain undetected and may later on
have unintended, unpleasant, or even catastrophic consequences.

On the other hand, verification does not necessarily need to terminate with
the end of the development. In *runtime verification*, we check whether
a particular run of the system satisfies desired properties. This
has the advantage that we do not need to stop verification if we deploy the
system, and checking whether a specific run of the system satisfies the
desired property is of lower complexity compared to
model-checking [@LeuckerSchallhart]. The drawbacks are that it may be
costly to continuously monitor the behaviour of the system at runtime, and
once we find an error, it may be too late to do anything about it. This is
particularly true for hardware, and systems where the split between hardware
and software is decided rather late in the development process.

The idea of *self-verification* as envisioned in [@DFW:2015] is to investigate 
the middle ground in between: verify properties of the system as soon as 
practically possible, but as late as necessary. In other words, verification 
does not terminate with deployment, but is also not kept until the last moment. 

## About this thesis

This cumulative thesis is based on the original publications

[@Chimpanc]

: M. Ring, J. Stoppe, C. Luth, and R. Drechsler, “Change impact analysis for 
  hardware designs — from natural language to system level,” in *Forum on 
  Specification & Design Languages (FDL 2016)*, Bremen, Germany, Sep. 2016, pp. 
  1–7

[@Selfie2]

: M. Ring, F. Bornebusch, C. Lüth, R. Wille, and R. Drechsler, “Better Late Than 
  Never — Verification of Embedded Systems After Deployment,” in *Design, 
  Automation Test in Europe Conference Exhibition (DATE 2019)*, Florence, Italy, 
  Mar. 2019, pp. 890–895

[@Timing]

: M. Ring and C. Lüth, “Let’s Prove It Later — Verification at Different Points 
  in Time,” in *International Conference on Software Engineering and Formal 
  Methods (SEFM 2019)*, Oslo, Norway, Sep. 2019, pp. 454–468

[@VerificationRuntime]

: M. Ring, F. Bornebusch, C. Lüth, R. Wille, and R. Drechsler, “Verification 
  Runtime Analysis — Get the Most Out of Partial Verification,” in *Design, 
  Automation Test in Europe Conference Exhibition (DATE 2020)*, Grenoble, France, 
  Mar. 2020, pp. 873–878
{.refs}

### Source code

This thesis is accompanied by a large amount of code, implementing the described 
concepts, benchmarking these and providing user interfaces for interactive 
exploration. All code is publicly hosted on the code hosting platform GitHub. 
Whenever a section is accompanied by an implementation, a link of the following 
form is provided:

[![https://github.com/martinring/thesis - GitHub](https://gh-card.dev/repos/martinring/thesis.svg?fullname=)](https://github.com/martinring/thesis){.ghlink}

> All linked source code was developed solely by the author of this thesis,
> unless explicitly indicated otherwise.

### Structure

The thesis is structured as follows: [##chap:specific] intro